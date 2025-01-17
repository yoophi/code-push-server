import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from '.';

@Entity('apps')
export class App {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ name: 'owner_account_id' })
    ownerAccountId!: number;

    @ManyToOne(() => Account)
    @JoinColumn({ name: 'owner_account_id' })
    owner!: Account;

    @ManyToMany(() => Account)
    @JoinTable({
        name: 'collaborators',
        joinColumn: {
            name: 'app_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'collaborator_account_id', 
            referencedColumnName: 'id'
        }
    })
    collaborators!: Account[];

    @CreateDateColumn({ name: 'created_time' })
    createdTime!: Date;
}