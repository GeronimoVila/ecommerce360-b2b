export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  path: string;
  depth: number;
  is_active: boolean;
  products_count: number;
  is_leaf: boolean;
  children: CategoryTreeNode[];
}

export interface CreateCategoryDTO {
  name: string;
  parent_id?: string | null;
  is_active?: boolean;
}

export interface UpdateCategoryDTO {
  name?: string;
  parent_id?: string | null;
  is_active?: boolean;
}