export interface InventoryMaterial {
  qtde: number;
  modelo: string;
  codigoFornecedor: string;
}

export interface MasterMaterial {
  id?: string;
  modelo: string;
  codigoFornecedor: string;
}

export interface InventoryItem {
  id?: string;
  site: string;
  cidade: string;
  obs: string;
  local_armazenamento: string;
  responsavel_entrega: string;
  responsavel_recebimento: string;
  data_entrada: string;
  responsavel_coleta: string;
  responsavel_liberacao: string;
  data_saida: string;
  materiais: InventoryMaterial[];
  fotos_romaneio?: string[];
}

export interface VistoriaRF {
  id?: string;
  site: string;
  data: string;
  detentora?: string;
  id_detentora?: string;
  regional?: string;
  tipo_site?: string;
  infra?: string;
  latitude?: string;
  longitude?: string;
  altitude?: string;
  altura_torre?: string;
  uf?: string;
  municipio?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  foto_fachada?: string;
  foto_placa?: string;
  photos?: Record<string, string>;
  createdBy: string;
  createdAt: any;
  updatedBy?: string;
  updatedAt?: any;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface UserPermissions {
  inventario: boolean;
  vistoria: boolean;
  materiais: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions?: UserPermissions;
}
