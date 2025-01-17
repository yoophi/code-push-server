import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { App } from ".";
import { AccessKey } from "./access-key.entity";

@Entity('accounts')
export class Account {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    email!: string;

    @Column()
    name!: string;

    @Column({ name: 'github_id' })
    githubId!: string;

    @CreateDateColumn({ name: 'created_time' })
    createdTime!: Date;

    @ManyToMany(() => App)
    @JoinTable({
        name: 'collaborators',
        joinColumn: {
            name: 'collaborator_account_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'app_id',
            referencedColumnName: 'id'
        }
    })
    apps!: App[];

    @OneToMany(() => AccessKey, (accessKey) => accessKey.account, {
        cascade: true
    })
    accessKeys!: AccessKey[];
} 