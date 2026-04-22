import React, { useState, useEffect, lazy, Suspense } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MasterMaterial, UserProfile, VistoriaRF, InventoryItem } from '../types/inventory';
import { VISTORIA_PHOTO_SECTIONS } from '../constants/vistoria';
import { equipmentBase } from '../constants/equipment';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

import { 
  Package, 
  Plus, 
  LogOut, 
  Users, 
  FileText, 
  Search,
  Download,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Camera,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Database,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const InventoryForm = lazy(() => import('./InventoryForm'));
const InventoryView = lazy(() => import('./InventoryView'));
const VistoriaRFForm = lazy(() => import('./VistoriaRFForm'));
const VistoriaRFView = lazy(() => import('./VistoriaRFView'));
const UserForm = lazy(() => import('./UserForm'));
const MaterialManagement = lazy(() => import('./MaterialManagement'));
const VistoriaApprovalTab = lazy(() => import('./VistoriaApprovalTab'));

import InventoryTable from './InventoryTable';
import VistoriaRFTable from './VistoriaRFTable';
import UserManagement from './UserManagement';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  user: User;
  profile: UserProfile;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Dashboard({ user, profile, onLogout, isDarkMode, onToggleDarkMode }: DashboardProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [statsItems, setStatsItems] = useState<InventoryItem[]>([]);
  const [vistorias, setVistorias] = useState<VistoriaRF[]>([]);
  const [materials, setMaterials] = useState<MasterMaterial[]>([]);
  const [itemsLimit, setItemsLimit] = useState(30);
  const [vistoriasLimit, setVistoriasLimit] = useState(30);
  const [activeTab, setActiveTab] = useState<'home' | 'inventory' | 'users' | 'vistoria' | 'materias' | 'approval'>(
    'home'
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isVistoriaFormOpen, setIsVistoriaFormOpen] = useState(false);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [viewingVistoria, setViewingVistoria] = useState<VistoriaRF | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editingVistoria, setEditingVistoria] = useState<VistoriaRF | null>(null);
  const [selectedVistoriaIds, setSelectedVistoriaIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'open' | 'finalized'>('all');
  const [typeChartFilter, setTypeChartFilter] = useState<'all' | 'open' | 'finalized'>('all');
  const [motiveChartFilter, setMotiveChartFilter] = useState<'all' | 'open' | 'finalized'>('all');

  const handleImportMasterMaterials = async (materialsToImport: Omit<MasterMaterial, 'id'>[]) => {
    if (!user?.uid) return;
    const batch = writeBatch(db);
    materialsToImport.forEach((m) => {
      const newDocRef = doc(collection(db, 'materias'));
      batch.set(newDocRef, {
        ...m,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
    });
    await batch.commit();
  };

  useEffect(() => {
    const q = query(
      collection(db, 'inventory'), 
      orderBy('data_entrada', 'desc'),
      limit(itemsLimit)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setItems(inventoryData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory', user));

    const qVistoria = query(
      collection(db, 'vistorias_rf'), 
      orderBy('data', 'desc'),
      limit(vistoriasLimit)
    );
    const unsubscribeVistoria = onSnapshot(qVistoria, (snapshot) => {
      const vistoriaData: VistoriaRF[] = [];
      snapshot.forEach((doc) => {
        vistoriaData.push({ id: doc.id, ...doc.data() } as VistoriaRF);
      });
      setVistorias(vistoriaData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'vistorias_rf', user));

    const qMaterials = query(collection(db, 'materias'), orderBy('modelo', 'asc'));
    const unsubscribeMaterials = onSnapshot(qMaterials, (snapshot) => {
      const materialsData: MasterMaterial[] = [];
      snapshot.forEach((doc) => {
        materialsData.push({ id: doc.id, ...doc.data() } as MasterMaterial);
      });
      setMaterials(materialsData);
      
      // Auto-import base if empty
      if (materialsData.length === 0 && user?.uid) {
        handleImportMasterMaterials(equipmentBase);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'materias', user));

    // Monitoramento de TODOS os itens do inventário para estatísticas em tempo real
    const qStats = query(collection(db, 'inventory'));
    const unsubscribeStats = onSnapshot(qStats, (snapshot) => {
      const inventoryData: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setStatsItems(inventoryData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory_stats', user));

    return () => {
      unsubscribe();
      unsubscribeVistoria();
      unsubscribeMaterials();
      unsubscribeStats();
    };
  }, [user?.uid, itemsLimit, vistoriasLimit]);

  useEffect(() => {
    if (viewingVistoria) {
      const updated = vistorias.find(v => v.id === viewingVistoria.id);
      if (updated) setViewingVistoria(updated);
    }
  }, [vistorias, viewingVistoria?.id]);

  useEffect(() => {
    if (viewingItem) {
      const updated = items.find(i => i.id === viewingItem.id);
      if (updated) setViewingItem(updated);
    }
  }, [items, viewingItem?.id]);

  const handleSaveItem = async (item: Omit<InventoryItem, 'id'>) => {
    setSaveError(null);
    setIsSaving(true);
    try {
      // Check document size (rough estimate)
      const dataStr = JSON.stringify(item);
      if (dataStr.length > 900000) { // ~900KB
        throw new Error("O registro é muito grande (muitas fotos ou fotos muito pesadas). Tente reduzir o número de fotos.");
      }

      if (editingItem?.id) {
        const itemRef = doc(db, 'inventory', editingItem.id);
        await updateDoc(itemRef, {
          ...item,
          updatedBy: user.uid,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'inventory'), {
          ...item,
          createdBy: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsFormOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error("Erro ao salvar item:", error);
      if (error.message.includes("too large")) {
        setSaveError("Erro: O registro excede o limite de tamanho do banco de dados (1MB). Reduza o número ou o tamanho das fotos.");
      } else {
        setSaveError(error.message || "Ocorreu um erro ao salvar o registro. Verifique sua conexão.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (profile.role !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'inventory', id));
    } catch (error) {
      console.error("Erro ao excluir item:", error);
    }
  };

  const handleSaveVistoria = async (vistoria: Omit<VistoriaRF, 'id' | 'createdBy' | 'createdAt'>, stayOpen = false) => {
    setSaveError(null);
    setIsSaving(true);
    try {
      // Separamos os dados da vistoria das fotos reais para não estourar o limite de 1MB do documento
      const headerData = { ...vistoria };
      const photosMap = headerData.photos || {};
      delete headerData.photos; // Não salvamos o mapa de fotos no documento principal

      let vistoriaId = editingVistoria?.id;

      if (vistoriaId) {
        const vistoriaRef = doc(db, 'vistorias_rf', vistoriaId);
        await updateDoc(vistoriaRef, {
          ...headerData,
          updatedBy: user.uid,
          updatedAt: serverTimestamp()
        });
      } else {
        const docRef = await addDoc(collection(db, 'vistorias_rf'), {
          ...headerData,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          status: 'pending'
        });
        vistoriaId = docRef.id;
        
        if (stayOpen) {
          setEditingVistoria({ id: vistoriaId, ...headerData } as VistoriaRF);
        }
      }

      // Se houver fotos novas no mapa (ao finalizar ou clicar em exportar), garantimos que sejam salvas
      if (vistoriaId && photosMap && Object.keys(photosMap).length > 0) {
        const batch = writeBatch(db);
        Object.entries(photosMap).forEach(([fieldId, base64]) => {
          if (base64 && base64.startsWith('data:image')) {
            const photoRef = doc(db, 'vistorias_rf', vistoriaId!, 'photo_data', fieldId);
            batch.set(photoRef, { data: base64, updatedAt: serverTimestamp() });
          }
        });
        await batch.commit();
      }
      
      if (!stayOpen) {
        setIsVistoriaFormOpen(false);
        setEditingVistoria(null);
      }
    } catch (error: any) {
      console.error("Erro ao salvar vistoria:", error);
      setSaveError(error.message || "Erro ao salvar vistoria.");
    } finally {
      setIsSaving(false);
    }
  };

  const syncVistoriaPhoto = async (vistoriaId: string, fieldId: string, base64: string) => {
    try {
      const photoRef = doc(db, 'vistorias_rf', vistoriaId, 'photo_data', fieldId);
      await setDoc(photoRef, { 
        data: base64, 
        updatedAt: serverTimestamp() 
      });
      // Também atualizamos o cabeçalho para registrar que a foto existe
      const vistoriaRef = doc(db, 'vistorias_rf', vistoriaId);
      await updateDoc(vistoriaRef, {
        [`photos_presence.${fieldId}`]: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro na sincronização automática da foto:", error);
    }
  };

  const handleDeleteVistoria = async (id: string) => {
    if (profile.role !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'vistorias_rf', id));
    } catch (error) {
      console.error("Erro ao excluir vistoria:", error);
    }
  };

  const handleUpdateVistoria = async (id: string, data: Partial<VistoriaRF>) => {
    try {
      const vistoriaRef = doc(db, 'vistorias_rf', id);
      await updateDoc(vistoriaRef, {
        ...data,
        updatedBy: user.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'vistorias_rf', user);
    }
  };

  const handleApproveVistoria = async (id: string, feedback: string) => {
    try {
      const vistoriaRef = doc(db, 'vistorias_rf', id);
      await updateDoc(vistoriaRef, {
        status: 'approved',
        approvalFeedback: feedback,
        approvedBy: user.uid,
        approvedAt: serverTimestamp(),
        rejectedPhotos: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'vistorias_rf', user);
    }
  };

  const handleRejectVistoria = async (id: string, feedback: string) => {
    try {
      const vistoriaRef = doc(db, 'vistorias_rf', id);
      await updateDoc(vistoriaRef, {
        status: 'rejected',
        approvalFeedback: feedback,
        approvedBy: user.uid,
        approvedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'vistorias_rf', user);
    }
  };

  const handleSaveMasterMaterial = async (material: Omit<MasterMaterial, 'id'>) => {
    try {
      await addDoc(collection(db, 'materias'), {
        ...material,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao salvar material:", error);
    }
  };

  const handleUpdateMasterMaterial = async (id: string, material: Partial<MasterMaterial>) => {
    try {
      const materialRef = doc(db, 'materias', id);
      await updateDoc(materialRef, {
        ...material,
        updatedBy: user.uid,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao atualizar material:", error);
    }
  };

  const handleDeleteMasterMaterial = async (id: string) => {
    if (profile.role !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'materias', id));
    } catch (error) {
      console.error("Erro ao excluir material:", error);
      handleFirestoreError(error, OperationType.DELETE, `materias/${id}`, user);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materiais.some(m => m.modelo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (inventoryFilter === 'open') return !item.data_saida;
    if (inventoryFilter === 'finalized') return !!item.data_saida;
    return true;
  });

  const filteredVistorias = vistorias.filter(v => 
    v.site.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = [
      'SITE', 'CIDADE', 'TIPO', 'VENDOR', 'MOTIVO', 'OBS', 'LOCAL ARMAZENAMENTO', 'RESPONSAVEL ENTREGA', 
      'RESPONSAVEL RECEBIMENTO', 'DATA ENTRADA', 'RESPONSAVEL COLETA', 
      'RESPONSAVEL LIBERACAO', 'DATA SAIDA', 'MATERIAIS'
    ];

    const csvRows = filteredItems.map(item => [
      item.site,
      item.cidade,
      item.tipo || '',
      item.vendor || '',
      item.motivo || '',
      item.obs,
      item.local_armazenamento,
      item.responsavel_entrega,
      item.responsavel_recebimento,
      item.data_entrada,
      item.responsavel_coleta,
      item.responsavel_liberacao,
      item.data_saida,
      item.materiais.map(m => `${m.qtde}x ${m.modelo}`).join(' | ')
    ].map(val => `"${val}"`).join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventário');

      // Define columns
      worksheet.columns = [
        { header: 'SITE', key: 'site', width: 15 },
        { header: 'CIDADE', key: 'cidade', width: 20 },
        { header: 'TIPO', key: 'tipo', width: 10 },
        { header: 'VENDOR', key: 'vendor', width: 15 },
        { header: 'MOTIVO', key: 'motivo', width: 20 },
        { header: 'OBS', key: 'obs', width: 30 },
        { header: 'LOCAL ARMAZENAMENTO', key: 'local', width: 20 },
        { header: 'RESP. ENTREGA', key: 'resp_entrega', width: 20 },
        { header: 'RESP. RECEBIMENTO', key: 'resp_recebimento', width: 20 },
        { header: 'DATA ENTRADA', key: 'data_entrada', width: 15 },
        { header: 'RESP. COLETA', key: 'resp_coleta', width: 20 },
        { header: 'RESP. LIBERAÇÃO', key: 'resp_liberacao', width: 20 },
        { header: 'DATA SAÍDA', key: 'data_saida', width: 15 },
        { header: 'MATERIAIS', key: 'materiais', width: 40 },
        { header: 'FOTOS', key: 'fotos', width: 50 }
      ];

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      for (let i = 0; i < filteredItems.length; i++) {
        const item = filteredItems[i];
        const rowIndex = i + 2;
        const row = worksheet.addRow({
          site: item.site,
          cidade: item.cidade,
          tipo: item.tipo || '',
          vendor: item.vendor || '',
          motivo: item.motivo || '',
          obs: item.obs,
          local: item.local_armazenamento,
          resp_entrega: item.responsavel_entrega,
          resp_recebimento: item.responsavel_recebimento,
          data_entrada: item.data_entrada,
          resp_coleta: item.responsavel_coleta,
          resp_liberacao: item.responsavel_liberacao,
          data_saida: item.data_saida,
          materiais: item.materiais.map(m => `${m.qtde}x ${m.modelo}`).join(' | ')
        });

        row.height = 80; // Set row height for images

        // Add images if they exist
        if (item.fotos_romaneio && item.fotos_romaneio.length > 0) {
          for (let j = 0; j < Math.min(item.fotos_romaneio.length, 3); j++) {
            try {
              const base64 = item.fotos_romaneio[j];
              // Extract data from base64 string
              const base64Data = base64.split(',')[1];
              const extension = base64.split(';')[0].split('/')[1];

              const imageId = workbook.addImage({
                base64: base64Data,
                extension: extension as any,
              });

              worksheet.addImage(imageId, {
                tl: { col: 11, row: rowIndex - 1 },
                ext: { width: 100, height: 100 },
                editAs: 'oneCell'
              });
            } catch (err) {
              console.error("Erro ao adicionar imagem ao Excel:", err);
            }
          }
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `relatorio_estoque_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      alert("Erro ao exportar para Excel. Verifique o console para mais detalhes.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportVistoriasToExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Vistorias RF');

      const itemsToExport = selectedVistoriaIds.length > 0 
        ? filteredVistorias.filter(v => selectedVistoriaIds.includes(v.id!))
        : filteredVistorias;

      // Define columns
      const photoColumns = VISTORIA_PHOTO_SECTIONS.flatMap(section => 
        section.fields.map(field => ({
          header: field.label,
          key: `photo_${field.id}`,
          width: 40
        }))
      );

      worksheet.columns = [
        { header: 'SITE', key: 'site', width: 15 },
        { header: 'DATA', key: 'data', width: 15 },
        { header: 'DETENTORA', key: 'detentora', width: 15 },
        { header: 'ID DETENTORA', key: 'id_detentora', width: 15 },
        { header: 'REGIONAL', key: 'regional', width: 15 },
        { header: 'TIPO DE SITE', key: 'tipo_site', width: 15 },
        { header: 'INFRA', key: 'infra', width: 15 },
        { header: 'LATITUDE', key: 'latitude', width: 15 },
        { header: 'LONGITUDE', key: 'longitude', width: 15 },
        { header: 'ALTITUDE', key: 'altitude', width: 15 },
        { header: 'ALTURA TORRE', key: 'altura_torre', width: 15 },
        { header: 'UF', key: 'uf', width: 5 },
        { header: 'MUNICÍPIO', key: 'municipio', width: 20 },
        { header: 'ENDEREÇO', key: 'endereco', width: 30 },
        { header: 'NÚMERO', key: 'numero', width: 10 },
        { header: 'BAIRRO', key: 'bairro', width: 20 },
        { header: 'FOTO FACHADA', key: 'foto_fachada', width: 40 },
        { header: 'FOTO PLACA', key: 'foto_placa', width: 40 },
        ...photoColumns
      ];

      // Style header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      for (let i = 0; i < itemsToExport.length; i++) {
        const item = itemsToExport[i];
        const rowIndex = i + 2;
        
        // Fetch photos from subcollection for this item
        const itemPhotos: Record<string, string> = { ...item.photos };
        let itemFachada = item.foto_fachada;
        let itemPlaca = item.foto_placa;

        try {
          const photoDataRef = collection(db, 'vistorias_rf', item.id!, 'photo_data');
          const photoSnapshot = await getDocs(photoDataRef);
          photoSnapshot.forEach(photoDoc => {
            const data = photoDoc.data().data;
            if (photoDoc.id === 'foto_fachada') itemFachada = data;
            else if (photoDoc.id === 'foto_placa') itemPlaca = data;
            else itemPhotos[photoDoc.id] = data;
          });
        } catch (err) {
          console.error(`Erro ao buscar fotos para exportação do item ${item.id}:`, err);
        }

        const rowData: any = {
          site: item.site,
          data: item.data ? format(new Date(item.data), 'dd/MM/yyyy') : '-',
          detentora: item.detentora || '-',
          id_detentora: item.id_detentora || '-',
          regional: item.regional || '-',
          tipo_site: item.tipo_site || '-',
          infra: item.infra || '-',
          latitude: item.latitude || '-',
          longitude: item.longitude || '-',
          altitude: item.altitude || '-',
          altura_torre: item.altura_torre || '-',
          uf: item.uf || '-',
          municipio: item.municipio || '-',
          endereco: item.endereco || '-',
          numero: item.numero || '-',
          bairro: item.bairro || '-',
          foto_fachada: itemFachada ? 'Imagem' : '-',
          foto_placa: itemPlaca ? 'Imagem' : '-'
        };

        VISTORIA_PHOTO_SECTIONS.forEach(section => {
          section.fields.forEach(field => {
            rowData[`photo_${field.id}`] = itemPhotos[field.id] ? 'Imagem' : '-';
          });
        });

        const row = worksheet.addRow(rowData);
        row.height = 100;

        // Helper to add image to cell
        const addImageToCell = (base64: string, colIndex: number) => {
          try {
            const base64Data = base64.split(',')[1];
            const extension = base64.split(';')[0].split('/')[1];
            const imageId = workbook.addImage({
              base64: base64Data,
              extension: extension as any,
            });
            worksheet.addImage(imageId, {
              tl: { col: colIndex, row: rowIndex - 1 },
              ext: { width: 120, height: 120 },
              editAs: 'oneCell'
            });
          } catch (err) {
            console.error(`Erro ao adicionar imagem na coluna ${colIndex}:`, err);
          }
        };

        // Add Foto Fachada
        if (itemFachada) addImageToCell(itemFachada, 16);
        // Add Foto Placa
        if (itemPlaca) addImageToCell(itemPlaca, 17);

        // Add all other photos
        let currentPhotoCol = 18;
        VISTORIA_PHOTO_SECTIONS.forEach(section => {
          section.fields.forEach(field => {
            const photoData = itemPhotos[field.id];
            if (photoData) {
              addImageToCell(photoData, currentPhotoCol);
            }
            currentPhotoCol++;
          });
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `vistorias_rf_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erro ao exportar vistorias para Excel:", error);
      alert("Erro ao exportar vistorias para Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportVistoriasToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const itemsToExport = selectedVistoriaIds.length > 0 
        ? filteredVistorias.filter(v => selectedVistoriaIds.includes(v.id!))
        : filteredVistorias;

      doc.setFontSize(18);
      doc.text('Relatório de Vistorias RF', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

      const tableData = itemsToExport.map(item => [
        item.site,
        item.data ? format(new Date(item.data), 'dd/MM/yyyy') : '-'
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Site', 'Data']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      // Add photos on separate pages for each item
      for (const item of itemsToExport) {
        // Fetch photos from subcollection for this item
        const itemPhotos: Record<string, string> = { ...item.photos };
        let itemFachada = item.foto_fachada;
        let itemPlaca = item.foto_placa;

        try {
          const photoDataRef = collection(db, 'vistorias_rf', item.id!, 'photo_data');
          const photoSnapshot = await getDocs(photoDataRef);
          photoSnapshot.forEach(photoDoc => {
            const data = photoDoc.data().data;
            if (photoDoc.id === 'foto_fachada') itemFachada = data;
            else if (photoDoc.id === 'foto_placa') itemPlaca = data;
            else itemPhotos[photoDoc.id] = data;
          });
        } catch (err) {
          console.error(`Erro ao buscar fotos para PDF do item ${item.id}:`, err);
        }

        doc.addPage();
        doc.setFontSize(16);
        doc.text(`Relatório de Vistoria: ${item.site}`, 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        const infoY = 30;
        doc.text(`Data: ${item.data ? format(new Date(item.data), 'dd/MM/yyyy') : '-'}`, 14, infoY);
        doc.text(`Município/UF: ${item.municipio || '-'}/${item.uf || '-'}`, 14, infoY + 5);
        doc.text(`Detentora: ${item.detentora || '-'} (${item.id_detentora || '-'})`, 14, infoY + 10);
        doc.text(`Coordenadas: ${item.latitude || '-'}, ${item.longitude || '-'}`, 14, infoY + 15);

        let currentY = infoY + 25;

        // Main Photos (Fachada and Placa)
        const addPhotoWithLabel = (label: string, photoData: string | undefined) => {
          if (!photoData) return;
          
          if (currentY > 240) {
            doc.addPage();
            currentY = 20;
          }
          
          doc.setFontSize(11);
          doc.setTextColor(0);
          doc.text(label, 14, currentY);
          try {
            // Simple check to avoid huge images crashing jspdf
            doc.addImage(photoData, 'JPEG', 14, currentY + 5, 180, 100);
            currentY += 115;
          } catch (e) {
            doc.text('[Erro ao processar imagem]', 14, currentY + 10);
            currentY += 20;
          }
        };

        addPhotoWithLabel('Foto 01 - Fachada:', itemFachada);
        addPhotoWithLabel('Foto 02 - Placa:', itemPlaca);

        // Detailed Photos
        VISTORIA_PHOTO_SECTIONS.forEach(section => {
          const sectionPhotos = section.fields.filter(f => itemPhotos[f.id]);
          if (sectionPhotos.length > 0) {
            if (currentY > 260) {
              doc.addPage();
              currentY = 20;
            }
            doc.setFontSize(13);
            doc.setTextColor(79, 70, 229); // Indigo
            doc.text(section.title, 14, currentY);
            currentY += 10;

            sectionPhotos.forEach(field => {
              const photo = itemPhotos[field.id];
              if (photo) {
                addPhotoWithLabel(field.label, photo);
              }
            });
          }
        });
      }

      doc.save(`vistorias_rf_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar vistorias para PDF:", error);
      alert("Erro ao exportar vistorias para PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const openSites = statsItems.filter(i => !i.data_saida);
  const openSitesDays = openSites.map(item => {
    const start = new Date(item.data_entrada);
    const end = new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  const avgDays = openSitesDays.length > 0 
    ? Math.round(openSitesDays.reduce((a, b) => a + b, 0) / openSitesDays.length) 
    : 0;
  const maxDays = openSitesDays.length > 0 ? Math.max(...openSitesDays) : 0;

  return (
    <div className={`flex h-screen overflow-hidden relative ${isDarkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 100 100" className="w-10 h-10">
                <path 
                  d="M78 45C75 30 60 20 45 20C25 20 10 35 10 55C10 75 25 90 45 90C65 90 78 75 78 55H45" 
                  fill="none" 
                  stroke="#0082c8" 
                  strokeWidth="14" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <circle cx="78" cy="18" r="12" fill="#0082c8" />
              </svg>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
              <div className="flex flex-col leading-none">
                <span className="font-black text-xl tracking-tighter text-[#0082c8]">GHC</span>
                <span className="font-light text-[8px] tracking-[0.2em] text-[#0082c8]">TELECOM</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Plus className="w-6 h-6 rotate-45" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button
            onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'home' 
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>

          {(profile.role === 'admin' || profile.permissions?.inventario) && (
            <button
              onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'inventory' 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <FileText className="w-5 h-5" />
              Inventário
            </button>
          )}

          {(profile.role === 'admin' || profile.permissions?.vistoria) && (
            <button
              onClick={() => { setActiveTab('vistoria'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'vistoria' 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Camera className="w-5 h-5" />
              Vistoria RF
            </button>
          )}

          {(profile.role === 'admin' || profile.permissions?.materiais) && (
            <button
              onClick={() => { setActiveTab('materias'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'materias' 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Package className="w-5 h-5" />
              Materiais
            </button>
          )}

          {(profile.role === 'admin' || profile.permissions?.aprovacao) && (
            <button
              onClick={() => { setActiveTab('approval'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'approval' 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              Aprovar Vistoria
            </button>
          )}
          
          {profile.role === 'admin' && (
            <button
              onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'users' 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Users className="w-5 h-5" />
              Usuários
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 flex items-center gap-3">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-700 shadow-sm"
              alt="Avatar"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 dark:bg-gray-950">
        <header className="h-auto min-h-[5rem] md:h-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-8 py-3 md:py-0 shrink-0">
          <div className="flex flex-wrap items-center gap-3 md:gap-4 flex-1">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Menu
              </button>
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {activeTab === 'home' ? 'Dashboard' :
                 activeTab === 'inventory' ? 'Materiais' : 
                 activeTab === 'vistoria' ? 'Vistoria RF' : 
                 activeTab === 'materias' ? 'Cadastro' : 
                 activeTab === 'approval' ? 'Aprovar Vistoria' : 'Usuários'}
              </h2>
            </div>
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 md:mx-2 hidden md:block" />
            
            {activeTab === 'inventory' && (
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
                <button
                  onClick={() => setInventoryFilter('all')}
                  className={`px-2 py-1 text-[9px] md:text-xs font-bold rounded-lg transition-all ${
                    inventoryFilter === 'all' 
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  TODOS
                </button>
                <button
                  onClick={() => setInventoryFilter('open')}
                  className={`px-2 py-1 text-[9px] md:text-xs font-bold rounded-lg transition-all ${
                    inventoryFilter === 'open' 
                      ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  EM ABERTO
                </button>
                <button
                  onClick={() => setInventoryFilter('finalized')}
                  className={`px-2 py-1 text-[9px] md:text-xs font-bold rounded-lg transition-all ${
                    inventoryFilter === 'finalized' 
                      ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  FINALIZADOS
                </button>
              </div>
            )}

            <div className="relative w-full md:w-auto order-last md:order-none mt-2 md:mt-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm w-full md:w-48 xl:w-64 focus:ring-2 focus:ring-indigo-500 transition-all text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onToggleDarkMode}
              className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title={isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {activeTab === 'inventory' && (
              <>
                <button 
                  onClick={exportToExcel}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all disabled:opacity-50"
                  title="Excel"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  <span className="hidden sm:inline">Excel</span>
                </button>
                {profile.role !== 'viewer' && (
                  <button 
                    onClick={() => {
                      setEditingItem(null);
                      setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Novo</span>
                    <span className="sm:hidden">Novo</span>
                  </button>
                )}
              </>
            )}
            {activeTab === 'vistoria' && (
              <div className="flex items-center gap-2 md:gap-3">
                {selectedVistoriaIds.length > 0 && (
                  <span className="hidden md:inline text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                    {selectedVistoriaIds.length}
                  </span>
                )}
                <button 
                  onClick={exportVistoriasToExcel}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button 
                  onClick={exportVistoriasToPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button 
                  onClick={() => {
                    setEditingVistoria(null);
                    setIsVistoriaFormOpen(true);
                  }}
                  className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Nova Vistoria</span>
                  <span className="sm:hidden">Nova</span>
                </button>
              </div>
            )}
            {activeTab === 'users' && profile.role === 'admin' && (
              <button 
                onClick={() => setIsUserFormOpen(true)}
                className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-bold text-xs md:text-sm shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Novo Usuário</span>
                <span className="sm:hidden">Novo</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'home' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Welcome Header */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Olá, {user.displayName?.split(' ')[0]}!</h3>
                  <p className="text-gray-500 dark:text-gray-400">Bem-vindo ao painel de controle da GHC Telecom.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                        <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg uppercase tracking-wider">Total</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sites em Depósito</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{openSites.length}</p>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Média: {avgDays}d</span>
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">Máx: {maxDays}d</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg uppercase tracking-wider">Pendente</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sites em Aberto</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{statsItems.filter(i => !i.data_saida).length}</p>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg uppercase tracking-wider">Concluído</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sites Finalizados</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{statsItems.filter(i => i.data_saida).length}</p>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Status do Inventário</h4>
                    <div className="h-[250px] w-full" style={{ minWidth: 0, minHeight: 0 }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Em Aberto', value: statsItems.filter(i => !i.data_saida).length },
                              { name: 'Finalizados', value: statsItems.filter(i => i.data_saida).length }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#10b981" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDarkMode ? '#111827' : '#fff', 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              color: isDarkMode ? '#fff' : '#000'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">Em Aberto</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">Finalizados</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Distribuição por Tipo</h4>
                      <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                        <button
                          onClick={() => setTypeChartFilter('all')}
                          className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all ${
                            typeChartFilter === 'all' 
                              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          TODOS
                        </button>
                        <button
                          onClick={() => setTypeChartFilter('open')}
                          className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all ${
                            typeChartFilter === 'open' 
                              ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          ABERTO
                        </button>
                        <button
                          onClick={() => setTypeChartFilter('finalized')}
                          className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all ${
                            typeChartFilter === 'finalized' 
                              ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          FINALIZ.
                        </button>
                      </div>
                    </div>
                    <div className="h-[250px] w-full" style={{ minWidth: 0, minHeight: 0 }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const counts: Record<string, number> = { 'TX': 0, 'RF': 0, 'Não Definido': 0 };
                              const dataset = statsItems.filter(i => {
                                if (typeChartFilter === 'open') return !i.data_saida;
                                if (typeChartFilter === 'finalized') return !!i.data_saida;
                                return true;
                              });
                              dataset.forEach(item => {
                                const key = item.tipo || 'Não Definido';
                                counts[key] = (counts[key] || 0) + 1;
                              });
                              return Object.entries(counts)
                                .filter(([_, value]) => value > 0)
                                .map(([name, value]) => ({ name, value }));
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(() => {
                              const colorMap: Record<string, string> = {
                                'TX': '#6366f1',
                                'RF': '#ec4899',
                                'Não Definido': '#8b5cf6'
                              };
                              const counts: Record<string, number> = { 'TX': 0, 'RF': 0, 'Não Definido': 0 };
                              const dataset = statsItems.filter(i => {
                                if (typeChartFilter === 'open') return !i.data_saida;
                                if (typeChartFilter === 'finalized') return !!i.data_saida;
                                return true;
                              });
                              dataset.forEach(item => {
                                const key = item.tipo || 'Não Definido';
                                counts[key] = (counts[key] || 0) + 1;
                              });
                              return Object.entries(counts)
                                .filter(([_, value]) => value > 0)
                                .map(([name]) => (
                                  <Cell key={`cell-${name}`} fill={colorMap[name] || '#cbd5e1'} />
                                ));
                            })()}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDarkMode ? '#111827' : '#fff', 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              color: isDarkMode ? '#fff' : '#000'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                      {[
                        { label: 'TX', color: '#6366f1' },
                        { label: 'RF', color: '#ec4899' },
                        { label: 'Não Definido', color: '#8b5cf6' }
                      ].map((type) => (
                        <div key={type.label} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                          <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">{type.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm relative">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">Distribuição por Motivo</h4>
                      <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg">
                        <button
                          onClick={() => setMotiveChartFilter('all')}
                          className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all ${
                            motiveChartFilter === 'all' 
                              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          TODOS
                        </button>
                        <button
                          onClick={() => setMotiveChartFilter('open')}
                          className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all ${
                            motiveChartFilter === 'open' 
                              ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          ABERTO
                        </button>
                        <button
                          onClick={() => setMotiveChartFilter('finalized')}
                          className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all ${
                            motiveChartFilter === 'finalized' 
                              ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          FINALIZ.
                        </button>
                      </div>
                    </div>
                    <div className="h-[250px] w-full" style={{ minWidth: 0, minHeight: 0 }}>
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart>
                          <Pie
                            data={(() => {
                              const categories = ['ZELADORIA', 'ACESSO', 'EHS-EDB', 'RFI', 'SOBRESSALENTE', 'Outros'];
                              const counts: Record<string, number> = {};
                              categories.forEach(cat => counts[cat] = 0);
                              
                              const dataset = statsItems.filter(i => {
                                if (motiveChartFilter === 'open') return !i.data_saida;
                                if (motiveChartFilter === 'finalized') return !!i.data_saida;
                                return true;
                              });

                              dataset.forEach(item => {
                                const key = item.motivo || 'Outros';
                                counts[key] = (counts[key] || 0) + 1;
                              });
                              return Object.entries(counts)
                                .filter(([_, value]) => value > 0)
                                .map(([name, value]) => ({ name, value }));
                            })()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {(() => {
                              const colorMap: Record<string, string> = {
                                'ZELADORIA': '#f43f5e',
                                'ACESSO': '#f59e0b',
                                'EHS-EDB': '#10b981',
                                'RFI': '#3b82f6',
                                'SOBRESSALENTE': '#8b5cf6',
                                'Outros': '#64748b'
                              };
                              const categories = ['ZELADORIA', 'ACESSO', 'EHS-EDB', 'RFI', 'SOBRESSALENTE', 'Outros'];
                              const counts: Record<string, number> = {};
                              categories.forEach(cat => counts[cat] = 0);

                              const dataset = statsItems.filter(i => {
                                if (motiveChartFilter === 'open') return !i.data_saida;
                                if (motiveChartFilter === 'finalized') return !!i.data_saida;
                                return true;
                              });

                              dataset.forEach(item => {
                                const key = item.motivo || 'Outros';
                                counts[key] = (counts[key] || 0) + 1;
                              });
                              return Object.entries(counts)
                                .filter(([_, value]) => value > 0)
                                .map(([name]) => (
                                  <Cell key={`cell-${name}`} fill={colorMap[name] || '#cbd5e1'} />
                                ));
                            })()}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDarkMode ? '#111827' : '#fff', 
                              borderRadius: '16px', 
                              border: 'none', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              color: isDarkMode ? '#fff' : '#000'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {[
                        { label: 'ZELADORIA', color: '#f43f5e' },
                        { label: 'ACESSO', color: '#f59e0b' },
                        { label: 'EHS-EDB', color: '#10b981' },
                        { label: 'RFI', color: '#3b82f6' },
                        { label: 'SOBRESSALENTE', color: '#8b5cf6' },
                        { label: 'Outros', color: '#64748b' }
                      ].map((motivo) => (
                        <div key={motivo.label} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: motivo.color }} />
                          <span className="text-[9px] text-gray-600 dark:text-gray-400 font-medium">{motivo.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Activity Section */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Atividade Recente</h4>
                    <div className="space-y-4">
                      {items.slice(0, 5).map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{item.site}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.cidade}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                              {(() => {
                                const start = new Date(item.data_entrada);
                                const end = item.data_saida ? new Date(item.data_saida) : new Date();
                                const diffTime = Math.abs(end.getTime() - start.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                return `${diffDays} dias`;
                              })()}
                            </p>
                            <span className={`text-[10px] font-bold uppercase ${item.data_saida ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {item.data_saida ? 'Saída' : 'Estoque'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {items.length === 0 && (
                        <p className="text-center text-gray-400 dark:text-gray-500 py-12">Nenhuma atividade registrada.</p>
                      )}
                    </div>
                    {items.length > 5 && (
                      <button 
                        onClick={() => setActiveTab('inventory')}
                        className="w-full mt-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors"
                      >
                        Ver tudo
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'inventory' ? (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Stats Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                      <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sites em Depósito</p>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{openSites.length}</p>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Média: {avgDays}d</p>
                          <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">Máx: {maxDays}d</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sites em Aberto</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.filter(i => !i.data_saida).length}</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sites Finalizados</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.filter(i => i.data_saida).length}</p>
                    </div>
                  </div>
                </div>

                <InventoryTable 
                  items={filteredItems} 
                  onEdit={(item) => {
                    if (profile.role === 'viewer') return;
                    setEditingItem(item);
                    setIsFormOpen(true);
                  }}
                  onView={(item) => setViewingItem(item)}
                  onDelete={handleDeleteItem}
                  canDelete={profile.role === 'admin'}
                  canEdit={profile.role !== 'viewer'}
                />
                
                {items.length >= itemsLimit && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setItemsLimit(prev => prev + 50)}
                      className="px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                    >
                      Carregar mais sites...
                    </button>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'vistoria' ? (
              <motion.div
                key="vistoria"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <VistoriaRFTable 
                  items={filteredVistorias} 
                  selectedIds={selectedVistoriaIds}
                  onSelect={(id) => {
                    setSelectedVistoriaIds(prev => 
                      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                    );
                  }}
                  onSelectAll={(ids) => setSelectedVistoriaIds(ids)}
                  onEdit={(item) => {
                    if (profile.role === 'viewer') return;
                    setEditingVistoria(item);
                    setIsVistoriaFormOpen(true);
                  }}
                  onView={(item) => setViewingVistoria(item)}
                  onDelete={handleDeleteVistoria}
                  canDelete={profile.role === 'admin'}
                  canEdit={profile.role !== 'viewer'}
                />
                
                {vistorias.length >= vistoriasLimit && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setVistoriasLimit(prev => prev + 50)}
                      className="px-8 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                    >
                      Carregar mais vistorias...
                    </button>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'materias' ? (
              <motion.div
                key="materias"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
                  <MaterialManagement 
                    materials={materials}
                    onAdd={handleSaveMasterMaterial}
                    onUpdate={handleUpdateMasterMaterial}
                    onDelete={handleDeleteMasterMaterial}
                    onImportBase={handleImportMasterMaterials}
                    canEdit={profile.role !== 'viewer'}
                    canDelete={profile.role === 'admin'}
                  />
                </Suspense>
              </motion.div>
            ) : activeTab === 'approval' ? (
              <motion.div
                key="approval"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
                  <VistoriaApprovalTab 
                    vistorias={vistorias}
                    onApprove={handleApproveVistoria}
                    onReject={handleRejectVistoria}
                    onDelete={handleDeleteVistoria}
                    onView={(v) => setViewingVistoria(v)}
                    currentUser={user}
                    profile={profile}
                  />
                </Suspense>
              </motion.div>
            ) : (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <UserManagement currentUser={user} searchTerm={searchTerm} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Form Modal */}
      <AnimatePresence>
        {viewingItem && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-white" /></div>}>
            <InventoryView 
              item={viewingItem}
              onClose={() => setViewingItem(null)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-white" /></div>}>
            <InventoryForm 
              item={editingItem} 
              materials={materials}
              onClose={() => {
                setIsFormOpen(false);
                setEditingItem(null);
                setSaveError(null);
              }} 
              onSave={handleSaveItem}
              isSaving={isSaving}
              saveError={saveError}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Vistoria Form Modal */}
      <AnimatePresence>
        {viewingVistoria && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-white" /></div>}>
            <VistoriaRFView 
              item={viewingVistoria}
              onClose={() => setViewingVistoria(null)}
              onUpdate={handleUpdateVistoria}
              onDelete={handleDeleteVistoria}
              onApprove={handleApproveVistoria}
              onReject={handleRejectVistoria}
              canEdit={profile.role !== 'viewer'}
              canDelete={profile.role === 'admin'}
              canApprove={profile.role === 'admin' || profile.permissions?.aprovacao}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVistoriaFormOpen && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-white" /></div>}>
            <VistoriaRFForm 
              item={editingVistoria} 
              onClose={() => {
                setIsVistoriaFormOpen(false);
                setEditingVistoria(null);
                setSaveError(null);
              }} 
              onSave={handleSaveVistoria}
              onSyncPhoto={syncVistoriaPhoto}
              isSaving={isSaving}
              saveError={saveError}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* User Form Modal */}
      <AnimatePresence>
        {isUserFormOpen && (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-white" /></div>}>
            <UserForm 
              onClose={() => setIsUserFormOpen(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
