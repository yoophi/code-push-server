import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from './account.entity';

@Entity('access_keys')
export class AccessKey {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'account_id' })
    accountId!: number;

    @ManyToOne(() => Account, (account) => account.accessKeys)
    @JoinColumn({ name: 'account_id' })
    account!: Account;

    @Column()
    name!: string;

    @Column({ name: 'friendly_name' })
    friendlyName!: string;

    @Column()
    description!: string;

    @Column({ name: 'created_by' })
    createdBy!: string;

    @CreateDateColumn({ name: 'created_time' })
    createdTime!: Date;

    @Column()
    expires!: Date;

    @Column({ name: 'is_session' })
    isSession!: boolean;
} 