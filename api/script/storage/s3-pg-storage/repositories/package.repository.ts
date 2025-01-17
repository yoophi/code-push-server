import { AppDataSource } from "../data-source";
import { Package } from "../entities/package.entity";

const packageRepository = AppDataSource.getRepository(Package);

export const createPackage = async (data: Partial<Package>): Promise<Package> => {
    const pkg = packageRepository.create(data);
    return await packageRepository.save(pkg);
};

export const getPackageById = async (id: number): Promise<Package | null> => {
    return await packageRepository.findOneBy({ id });
};

export const getPackagesByDeploymentId = async (deploymentId: number): Promise<Package[]> => {
    return await packageRepository
        .createQueryBuilder("package")
        .innerJoin("deployment_packages", "dp", "dp.package_id = package.id")
        .where("dp.deployment_id = :deploymentId", { deploymentId })
        .orderBy("package.upload_time", "DESC")
        .getMany();
}; 