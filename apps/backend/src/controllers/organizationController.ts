import { Request, Response } from 'express';
import prisma from '../config/database';

export const getOrganizationTree = async (req: Request, res: Response) => {
  try {
    const orgs = await prisma.organization.findMany({
      include: { children: true },
      orderBy: { code: 'asc' },
    });
    
    const buildTree = (parentId: string | null): any[] => {
      return orgs
        .filter(org => org.parentId === parentId)
        .map(org => ({
          ...org,
          children: buildTree(org.id),
        }));
    };
    
    res.json(buildTree(null));
  } catch {
    res.status(500).json({ error: 'Failed to fetch org tree' });
  }
};

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const org = await prisma.organization.create({ data: req.body });
    res.status(201).json(org);
  } catch {
    res.status(500).json({ error: 'Failed to create org' });
  }
};

export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const org = await prisma.organization.update({
      where: { id },
      data: req.body,
    });
    res.json(org);
  } catch {
    res.status(500).json({ error: 'Failed to update org' });
  }
};

export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const children = await prisma.organization.findMany({ where: { parentId: id } });
    if (children.length > 0) {
      return res.status(400).json({ error: '该组织下存在子组织，无法删除' });
    }
    const users = await prisma.user.findMany({ where: { orgId: id } });
    if (users.length > 0) {
      return res.status(400).json({ error: '该组织下存在用户，无法删除' });
    }
    await prisma.organization.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Failed to delete org' });
  }
};
