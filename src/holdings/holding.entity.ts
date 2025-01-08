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

  @Entity('holdings') // Map this class to the 'holdings' table
  export class Holding {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User) // Many holdings can belong to one user
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'mint_address', type: 'varchar', length: 255 })
    mintAddress: string;

    @Column({ type: 'numeric', precision: 30, scale: 6, nullable: false })
    amount: number;

    @Column({ type: 'numeric', precision: 15, scale: 15, nullable: false })
    price: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
    value_usd: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0 })
    value_sol: number;

    @Column({ type: 'numeric', precision: 30, scale: 4, default: 0})
    pnl: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;
  }