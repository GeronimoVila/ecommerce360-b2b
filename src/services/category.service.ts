import { apiClient } from './apiClient';
import type { CategoryTreeNode, CreateCategoryDTO, UpdateCategoryDTO } from '../types/category';

const BASE_PATH = 'categories';

export const CategoryService = {
  getTree: async (includeInactive = false): Promise<CategoryTreeNode[]> => {
    const query = includeInactive ? '?include_inactive=true' : '';
    const response = await apiClient.get(`${BASE_PATH}/tree${query}`);
    return response.data.data;
  },

  create: async (data: CreateCategoryDTO): Promise<CategoryTreeNode> => {
    const response = await apiClient.post(BASE_PATH, data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateCategoryDTO): Promise<CategoryTreeNode> => {
    const response = await apiClient.patch(`${BASE_PATH}/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  },

  flattenTree: (nodes: CategoryTreeNode[], prefix = ''): Array<{ id: string; label: string; node: CategoryTreeNode }> => {
    return nodes.flatMap((node) => {
      const currentLabel = prefix ? `${prefix} › ${node.name}` : node.name;
      return [
        { id: node.id, label: currentLabel, node },
        ...CategoryService.flattenTree(node.children || [], currentLabel),
      ];
    });
  },

  findPathIds: (nodes: CategoryTreeNode[], targetId: string): string[] => {
    for (const node of nodes) {
      if (node.id === targetId) return [node.id];
      if (node.children?.length) {
        const subPath = CategoryService.findPathIds(node.children, targetId);
        if (subPath.length > 0) return [node.id, ...subPath];
      }
    }
    return [];
  }
};