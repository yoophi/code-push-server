import { AppDataSource } from "../data-source";
import { Deployment } from "../entities/deployment.entity";

const deploymentRepository = AppDataSource.getRepository(Deployment);

export const createDeployment = async (data: Partial<Deployment>): Promise<Deployment> => {
    const deployment = deploymentRepository.create(data);
    return await deploymentRepository.save(deployment);
};

export const getDeploymentById = async (id: number): Promise<Deployment | null> => {
    return await deploymentRepository.findOneBy({ id });
};

export const getDeploymentWithPackages = async (id: number): Promise<Deployment | null> => {
    return await deploymentRepository.findOne({
        where: { id },
        relations: ['packageHistory', 'package']
    });
}; 

export const getDeploymentWithPackage = async (id: number): Promise<Deployment | null> => {
    return await deploymentRepository.findOne({
        where: { id },
        relations: ['package']
    });
};

// export const getDeploymentList = async (appId: number  ): Promise<Deployment[]> => {
//     return await deploymentRepository.find({
//         where: {
//             appId
//         },
//         relations: {
//             package: true
//         }
//     });
// };