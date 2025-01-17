import { AppDataSource } from "../data-source";
import { Account } from "../entities/account.entity";

const accountRepository = AppDataSource.getRepository(Account);

export const createAccount = async (data: Partial<Account>): Promise<Account> => {
    const account = accountRepository.create(data);
    return await accountRepository.save(account);
};

export const getAccountById = async (id: number): Promise<Account | null> => {
    return await accountRepository.findOneBy({ id });
};

export const getAccountByEmail = async (email: string): Promise<Account | null> => {
    return await accountRepository.findOneBy({ email });
}; 

export const getAccountList = async (): Promise<Account[]> => {
    return await accountRepository.find({
        relations: {
            apps: true
        }
    });
};