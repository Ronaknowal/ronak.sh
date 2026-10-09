"""Incremental data-field SSE subset for an ordinary POST completion client.

Strict malformed UTF-8 refusal is deliberate, unlike EventSource replacement
decoding. Reconnection, retry, event types and last-event-ID are out of scope.
"""
import codecs
import json


class SSEDataParser:
    def __init__(self):
        self.decoder = codecs.getincrementaldecoder("utf-8-sig")("strict")
        self.line = []
        self.data = []
        self.after_cr = False
        self.closed = False
        self.discarded_partial_event = False

    def _end_line(self):
        line, self.line = "".join(self.line), []
        if line == "":
            if not self.data:
                return []
            event = "\n".join(self.data)
            self.data = []
            return [event]
        if line.startswith(":"):
            return []
        field, colon, value = line.partition(":")
        if colon and value.startswith(" "):
            value = value[1:]
        if field == "data":
            self.data.append(value if colon else "")
        return []

    def feed(self, chunk):
        if self.closed:
            raise ValueError("parser already finalized")
        if not isinstance(chunk, bytes):
            raise TypeError("feed requires bytes")
        events = []
        for char in self.decoder.decode(chunk):
            if self.after_cr:
                self.after_cr = False
                if char == "\n":
                    continue
            if char in "\r\n":
                events.extend(self._end_line())
                self.after_cr = char == "\r"
            else:
                self.line.append(char)
        return events

    def finish(self):
        if self.closed:
            raise ValueError("parser already finalized")
        self.closed = True
        self.decoder.decode(b"", final=True)  # Raises on unfinished UTF-8.
        self.discarded_partial_event = bool(self.line or self.data)
        self.line, self.data = [], []
        # EOF is not a blank-line dispatch, even if the payload is valid JSON.
        return []


def native_record(data):
    """llama.cpp /completion adapter; no implicit [DONE] compatibility mode."""
    result = json.loads(data)
    if not isinstance(result, dict):
        raise ValueError("expected a JSON object in the native event")
    if "stop" in result and not isinstance(result["stop"], bool):
        raise ValueError("stop must be boolean")
    if "content" in result and not isinstance(result["content"], str):
        raise ValueError("content must be text")
    if "tokens" in result:
        if not isinstance(result["tokens"], list) or any(
            isinstance(token, bool) or not isinstance(token, int) or token < 0
            for token in result["tokens"]
        ):
            raise ValueError("tokens must be an array of nonnegative integer IDs")
    return result


def parse_chunks(chunks):
    parser = SSEDataParser()
    events = []
    for chunk in chunks:
        events.extend(parser.feed(chunk))
    parser.finish()
    return events, parser.discarded_partial_event


if __name__ == "__main__":
    wire = b'\xef\xbb\xbf: ping\r\ndata: {"content":"\xc3\xa9","stop":false}\r\n\r\ndata: {"stop":true}\n\n'
    expected = ['{"content":"é","stop":false}', '{"stop":true}']
    for split in range(len(wire) + 1):
        events, partial = parse_chunks([wire[:split], wire[split:]])
        assert events == expected and not partial
    print([native_record(event) for event in expected])
    print("every two-chunk split", len(wire) + 1)
    print("partial EOF", parse_chunks([b'data: {"stop":true}']))
