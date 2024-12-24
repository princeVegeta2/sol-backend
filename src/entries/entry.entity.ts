import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { User } from '../user/user.entity'; 
  
  @Entity('entries') // Map this class to the 'entries' table
  export class Entry {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => User) // Many entries can belong to one user
    @JoinColumn({ name: 'user_id' }) // Maps the foreign key column to the user table
    user: User;
  
    @Column({ name: 'mint_address', type: 'varchar', length: 255 })
    mintAddress: string;
  
    @Column({ type: 'int' })
    amount: number;
  
    @Column({ type: 'numeric', precision: 30, scale: 10, default: 0 })
    price: number;
  
    @Column({ type: 'numeric', precision: 32, scale: 4, nullable: true })
    marketcap: number;
  
    @Column({ type: 'numeric', precision: 32, scale: 4, nullable: true })
    liquidity: number;
  
    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
  }
  