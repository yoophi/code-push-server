import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('blobs')
export class Blob {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: 'blob_id' })
    blobId!: string;

    @Column({ name: 'blob_url' })
    blobUrl!: string;

    @CreateDateColumn({ name: 'created_time' })
    createdTime!: Date;
}