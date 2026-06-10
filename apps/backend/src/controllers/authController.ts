import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, roleId: user.roleId },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
        role: user.role.name,
        dataScope: user.role.dataScope,
      },
    });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { username, password, realName, roleId, orgId } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        roleId,
        orgId,
      },
      include: { role: true },
    });
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      realName: user.realName,
      role: user.role.name,
    });
  } catch {
    res.status(500).json({ error: 'Registration failed' });
  }
};
