import { AppDataSource } from "../data-source";
import { App } from "../entities/app.entity";

const appRepository = AppDataSource.getRepository(App);

export const createApp = async (data: Partial<App>): Promise<App> => {
    const app = appRepository.create(data);
    return await appRepository.save(app);
};

export const getAppById = async (id: number): Promise<App | null> => {
    return await appRepository.findOneBy({ id });
}; 

export const getAppList = async (): Promise<App[]> => {
    return await appRepository.find({
        relations: {
            collaborators: true
        }
    });
};
