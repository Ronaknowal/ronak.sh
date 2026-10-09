"""Pair energy, analytic force, central difference and differentiable force loss."""
import torch


def energy(positions,spring):
    edges=torch.triu_indices(len(positions),len(positions),offset=1)
    relative=positions[edges[0]]-positions[edges[1]]
    return .5*spring*relative.square().sum()


def analytic_force(positions,spring):
    relative=positions[:,None]-positions[None,:]
    return -spring*relative.sum(1)


def central_force(positions,spring,step):
    result=torch.zeros_like(positions)
    for point in range(len(positions)):
        for coordinate in range(3):
            offset=torch.zeros_like(positions)
            offset[point,coordinate]=step
            result[point,coordinate]=-(energy(positions+offset,spring)-
                                      energy(positions-offset,spring))/(2*step)
    return result


def main():
    positions=torch.tensor([[0.,0.,0.],[1.,0.,0.],[0.,2.,0.]],dtype=torch.float64,requires_grad=True)
    spring=torch.tensor(1.,dtype=torch.float64,requires_grad=True)
    total=energy(positions,spring)
    force=-torch.autograd.grad(total,positions,create_graph=True)[0]
    expected=analytic_force(positions,spring)
    torch.testing.assert_close(force,expected,atol=1e-12,rtol=1e-12)
    difference=central_force(positions.detach(),spring.detach(),1e-5)
    torch.testing.assert_close(force,difference,atol=1e-8,rtol=1e-8)
    # create_graph keeps the force operation differentiable for a force target.
    force_loss=.5*force.square().sum()
    spring_gradient=torch.autograd.grad(force_loss,spring)[0]
    print('energy:',float(total.detach()))
    print('force:',force.detach().tolist())
    print('net force:',force.sum(0).detach().tolist())
    print('central difference maximum error:',float((force-difference).abs().max().detach()))
    print('force loss and spring gradient:',float(force_loss.detach()),float(spring_gradient))
    print('changed spring .4 force:',analytic_force(positions.detach(),.4).tolist())


if __name__=='__main__':
    main()
