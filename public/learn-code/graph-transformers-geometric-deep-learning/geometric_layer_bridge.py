"""An invariant scalar-message network updates scalar features and 3D points.

Edges are unique directed (source, receiver) pairs without self edges.
Requires PyTorch; no dataset, pretrained weights or fitting is needed.
"""
import copy
import math
import torch
from torch import nn


class GeometricLayer(nn.Module):
    def __init__(self, channels=2, message_width=4):
        super().__init__()
        self.edge = nn.Sequential(nn.Linear(2*channels+2, 8), nn.SiLU(),
                                  nn.Linear(8, message_width), nn.SiLU())
        self.coefficient = nn.Linear(message_width, 1)
        self.node = nn.Sequential(nn.Linear(channels+message_width, 8), nn.SiLU(),
                                  nn.Linear(8, channels))

    def forward(self, features, positions, edges, attributes, step=.1):
        source, receiver = edges
        relative = positions[receiver] - positions[source]
        squared_distance = relative.square().sum(-1, keepdim=True)
        inputs = torch.cat((features[receiver], features[source],
                            squared_distance, attributes[:, None]), -1)
        messages = self.edge(inputs)
        coefficients = self.coefficient(messages)
        # Each fresh accumulator belongs to this call. index_add_ accumulates
        # repeated receivers without copying the full output for every group.
        message_sum = features.new_zeros((len(features), messages.shape[-1]))
        message_sum.index_add_(0, receiver, messages)
        displacement = torch.zeros_like(positions)
        displacement.index_add_(0, receiver, relative*coefficients)
        next_features = features + self.node(torch.cat((features, message_sum), -1))
        next_positions = positions + step*displacement
        return next_features, next_positions


def dense_reference(layer, features, positions, edges, attributes, step=.1):
    source, receiver = edges
    n, d = features.shape
    allowed = torch.zeros((n, n), dtype=torch.bool, device=features.device)
    allowed[receiver, source] = True
    attribute_grid = features.new_zeros((n,n))
    attribute_grid[receiver, source] = attributes
    relative = positions[:, None] - positions[None, :]
    squared_distance = relative.square().sum(-1, keepdim=True)
    inputs = torch.cat((features[:, None].expand(n,n,d),
                        features[None, :].expand(n,n,d), squared_distance,
                        attribute_grid[..., None]), -1)
    messages = layer.edge(inputs)
    coefficients = layer.coefficient(messages)
    active = allowed[..., None]
    message_sum = torch.where(active, messages, 0.).sum(1)
    displacement = torch.where(active, relative*coefficients, 0.).sum(1)
    return (features + layer.node(torch.cat((features, message_sum), -1)),
            positions + step*displacement)


def hand_rule(positions, step=.1):
    relative = positions[:, None] - positions[None, :]
    coefficient = 1/(1+relative.square().sum(-1))
    coefficient = coefficient*(1-torch.eye(len(positions), dtype=positions.dtype))
    return positions + step*(relative*coefficient[..., None]).sum(1)


def frame_mix(local_query, local_key, receiver_rotation, donor_rotation,
              receiver_origin, donor_origin):
    query = receiver_rotation@local_query + receiver_origin
    key = donor_rotation@local_key + donor_origin
    output = .25*query + .75*key
    local_output = receiver_rotation.T@(output-receiver_origin)
    return query, key, (query-key).square().sum(), output, local_output


def rotation_z(degrees):
    angle = math.radians(degrees)
    c,s = math.cos(angle), math.sin(angle)
    return torch.tensor([[c,-s,0.],[s,c,0.],[0.,0.,1.]], dtype=torch.float64)


def main():
    torch.manual_seed(17)
    torch.set_num_threads(1)
    features = torch.tensor([[1.,.2],[-.4,.7],[.3,-.6]], dtype=torch.float64)
    positions = torch.tensor([[0.,0.,0.],[1.,0.,0.],[0.,1.,.5]], dtype=torch.float64)
    edges = torch.tensor([[0,1,0,2,1,2],[1,0,2,0,2,1]])
    attributes = torch.tensor([.2,.2,.5,.5,-.3,-.3], dtype=torch.float64)
    layer = GeometricLayer().double()
    other = copy.deepcopy(layer)
    left = [v.clone().requires_grad_() for v in (features,positions,attributes)]
    right = [v.clone().requires_grad_() for v in (features,positions,attributes)]
    actual = layer(left[0],left[1],edges,left[2])
    expected = dense_reference(other,right[0],right[1],edges,right[2])
    for a,b in zip(actual, expected, strict=True):
        torch.testing.assert_close(a,b,atol=1e-12,rtol=1e-12)
    # One scalar probe tests all input/attribute and learned parameter routes.
    sum(v.square().sum() for v in actual).backward()
    sum(v.square().sum() for v in expected).backward()
    for a,b in zip(left+list(layer.parameters()),right+list(other.parameters()),strict=True):
        torch.testing.assert_close(a.grad,b.grad,atol=1e-11,rtol=1e-11)
    torch.optim.SGD(layer.parameters(),lr=.02).step()
    torch.optim.SGD(other.parameters(),lr=.02).step()
    for a,b in zip(layer.parameters(),other.parameters(),strict=True):
        torch.testing.assert_close(a,b,atol=1e-12,rtol=1e-12)
    base = layer(features,positions,edges,attributes)
    shift = torch.tensor([3.,-2.,1.],dtype=torch.float64)
    proper = rotation_z(37)
    for q in (proper,proper@torch.diag(torch.tensor([-1.,1.,1.],dtype=torch.float64))):
        moved = layer(features,positions@q.T+shift,edges,attributes)
        torch.testing.assert_close(moved[0],base[0],atol=1e-12,rtol=1e-12)
        torch.testing.assert_close(moved[1],base[1]@q.T+shift,atol=1e-12,rtol=1e-12)
    print('input shapes:', tuple(features.shape),tuple(positions.shape),tuple(edges.shape))
    print('saved rule positions:', hand_rule(positions).tolist())
    print('learned scalar output:', base[0].tolist())
    print('learned point output:', base[1].tolist())
    print('dense output, all gradients and one SGD step: matched')
    print('proper/reflected common motion: matched')
    r_i,r_j=rotation_z(90),rotation_z(-90)
    frame=frame_mix(torch.tensor([1.,0.,0.],dtype=torch.float64),
                    torch.tensor([0.,1.,0.],dtype=torch.float64),r_i,r_j,
                    torch.tensor([2.,0.,0.],dtype=torch.float64),
                    torch.tensor([0.,2.,0.],dtype=torch.float64))
    print('frame query/key/distance/global/local:', [v.tolist() for v in frame])


if __name__ == '__main__':
    main()
