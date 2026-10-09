# Old Faithful: the R `faithful` record

`faithful.csv` supplies 272 eruption records in their existing order. `rownames`
is the source's one-based record number, not a clustering feature. `eruptions`
is eruption duration in minutes; `waiting` is the wait to the next eruption in
minutes. The lesson's zero-based displayed row ID equals `rownames - 1`.

The CSV is the R datasets `faithful` version, supplied offline without changing
its values or row order. The ordinary complete program `clustering_production.py`
also embeds the same two measurement columns. The retained CSV was retrieved
on 21 September 2026 from the Rdatasets mirror:
https://raw.githubusercontent.com/vincentarelbundock/Rdatasets/master/csv/datasets/faithful.csv

The primary measurement documentation is:
https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/faithful.html

R attributes this version to W. Härdle, *Smoothing Techniques: With Implementation
in S* (1991). Its eruption measurements are heavily rounded values originally
recorded in seconds, with frequent multiples of five. This file keeps the
published minute values; it does not apply the documentation's suggested
seconds-based correction. Azzalini and Bowman (1990), *A Look at Some Data on the
Old Faithful Geyser*, describe a fuller version. R's 272-row `faithful` and the
299-event fuller record are different versions, not interchangeable samples.

The source is distributed in R's `datasets` package within the GPL-2/GPL-3
licensed R distribution. Retain the upstream attribution and applicable license
terms when redistributing; this documentation does not assign a new license to
the observations. R's licensing details are at https://www.r-project.org/Licenses/.

These measurements support descriptive grouping of completed historical records.
The wait to the next eruption is unavailable when asking a duration-only
forecast question. This CSV does not by itself establish a forecasting protocol,
chronological ordering contract, human category labels, or independent test
performance. The lesson treats that separate duration-only workflow explicitly.
