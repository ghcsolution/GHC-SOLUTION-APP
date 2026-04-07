import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
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
  Filter,
  Download,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Camera,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';
import InventoryForm from './InventoryForm';
import InventoryTable from './InventoryTable';
import InventoryView from './InventoryView';
import VistoriaRFForm from './VistoriaRFForm';
import VistoriaRFTable from './VistoriaRFTable';
import VistoriaRFView from './VistoriaRFView';
import UserManagement from './UserManagement';
import UserForm from './UserForm';
import MaterialManagement from './MaterialManagement';
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
}

export default function Dashboard({ user, profile, onLogout }: DashboardProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [vistorias, setVistorias] = useState<VistoriaRF[]>([]);
  const [materials, setMaterials] = useState<MasterMaterial[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'users' | 'vistoria' | 'materias'>('inventory');
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
    const q = query(collection(db, 'inventory'), orderBy('data_entrada', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setItems(inventoryData);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'inventory', user));

    const qVistoria = query(collection(db, 'vistorias_rf'), orderBy('data', 'desc'));
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

    return () => {
      unsubscribe();
      unsubscribeVistoria();
      unsubscribeMaterials();
    };
  }, [user?.uid]);

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

  const handleSaveVistoria = async (vistoria: Omit<VistoriaRF, 'id' | 'createdBy' | 'createdAt'>) => {
    setSaveError(null);
    setIsSaving(true);
    try {
      if (editingVistoria?.id) {
        const vistoriaRef = doc(db, 'vistorias_rf', editingVistoria.id);
        await updateDoc(vistoriaRef, {
          ...vistoria,
          updatedBy: user.uid,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'vistorias_rf'), {
          ...vistoria,
          createdBy: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setIsVistoriaFormOpen(false);
      setEditingVistoria(null);
    } catch (error: any) {
      console.error("Erro ao salvar vistoria:", error);
      setSaveError(error.message || "Erro ao salvar vistoria.");
    } finally {
      setIsSaving(false);
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
    }
  };

  const filteredItems = items.filter(item => 
    item.site.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.materiais.some(m => m.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredVistorias = vistorias.filter(v => 
    v.site.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = [
      'SITE', 'CIDADE', 'OBS', 'LOCAL ARMAZENAMENTO', 'RESPONSAVEL ENTREGA', 
      'RESPONSAVEL RECEBIMENTO', 'DATA ENTRADA', 'RESPONSAVEL COLETA', 
      'RESPONSAVEL LIBERACAO', 'DATA SAIDA', 'MATERIAIS'
    ];

    const csvRows = filteredItems.map(item => [
      item.site,
      item.cidade,
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
          foto_fachada: item.foto_fachada ? 'Imagem' : '-',
          foto_placa: item.foto_placa ? 'Imagem' : '-'
        };

        VISTORIA_PHOTO_SECTIONS.forEach(section => {
          section.fields.forEach(field => {
            rowData[`photo_${field.id}`] = item.photos?.[field.id] ? 'Imagem' : '-';
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
        if (item.foto_fachada) addImageToCell(item.foto_fachada, 16);
        // Add Foto Placa
        if (item.foto_placa) addImageToCell(item.foto_placa, 17);

        // Add all other photos
        let currentPhotoCol = 18;
        VISTORIA_PHOTO_SECTIONS.forEach(section => {
          section.fields.forEach(field => {
            const photoData = item.photos?.[field.id];
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
        doc.addPage();
        doc.setFontSize(16);
        doc.text(`Detalhes da Vistoria: ${item.site}`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Data: ${item.data ? format(new Date(item.data), 'dd/MM/yyyy') : '-'}`, 14, 30);

        let currentY = 40;

        if (item.foto_fachada) {
          doc.text('Foto 01 - Fachada:', 14, currentY);
          try {
            doc.addImage(item.foto_fachada, 'JPEG', 14, currentY + 5, 180, 100);
            currentY += 115;
          } catch (e) {
            doc.text('[Erro ao carregar imagem da fachada]', 14, currentY + 10);
            currentY += 20;
          }
        }

        if (item.foto_placa) {
          if (currentY > 150) {
            doc.addPage();
            currentY = 20;
          }
          doc.text('Foto 02 - Placa:', 14, currentY);
          try {
            doc.addImage(item.foto_placa, 'JPEG', 14, currentY + 5, 180, 100);
          } catch (e) {
            doc.text('[Erro ao carregar imagem da placa]', 14, currentY + 10);
          }
        }
      }

      doc.save(`vistorias_rf_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar vistorias para PDF:", error);
      alert("Erro ao exportar vistorias para PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">GHC Solutions</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'inventory' 
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Inventário
          </button>

          <button
            onClick={() => setActiveTab('vistoria')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'vistoria' 
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Camera className="w-5 h-5" />
            Vistoria RF
          </button>

          <button
            onClick={() => setActiveTab('materias')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'materias' 
                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            }`}
          >
            <Package className="w-5 h-5" />
            Materiais
          </button>
          
          {profile.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'users' 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              Usuários
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              alt="Avatar"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{profile.role}</p>
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-white border-bottom border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === 'inventory' ? 'Controle de Materiais' : 
               activeTab === 'vistoria' ? 'Vistoria RF' : 
               activeTab === 'materias' ? 'Cadastro de Materiais' : 'Gestão de Acessos'}
            </h2>
            <div className="h-6 w-px bg-gray-200 mx-2" />
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Buscar site, cidade ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'inventory' && (
              <>
                <button 
                  onClick={exportToExcel}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
                  title="Exportar para Excel com fotos"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  Excel
                </button>
                <button 
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
                {profile.role !== 'viewer' && (
                  <button 
                    onClick={() => {
                      setEditingItem(null);
                      setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Registro
                  </button>
                )}
              </>
            )}
            {activeTab === 'vistoria' && (
              <div className="flex items-center gap-3">
                {selectedVistoriaIds.length > 0 && (
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                    {selectedVistoriaIds.length} selecionado(s)
                  </span>
                )}
                <button 
                  onClick={exportVistoriasToExcel}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
                  title={selectedVistoriaIds.length > 0 ? "Exportar selecionados para Excel" : "Exportar todos para Excel"}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  Excel
                </button>
                <button 
                  onClick={exportVistoriasToPDF}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                  title={selectedVistoriaIds.length > 0 ? "Imprimir selecionados em PDF" : "Imprimir todos em PDF"}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  PDF
                </button>
                <button 
                  onClick={() => {
                    setEditingVistoria(null);
                    setIsVistoriaFormOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Nova Vistoria
                </button>
              </div>
            )}
            {activeTab === 'users' && profile.role === 'admin' && (
              <button 
                onClick={() => setIsUserFormOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Novo Usuário
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'inventory' ? (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
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
              </motion.div>
            ) : activeTab === 'materias' ? (
              <motion.div
                key="materias"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <MaterialManagement 
                  materials={materials}
                  onAdd={handleSaveMasterMaterial}
                  onUpdate={handleUpdateMasterMaterial}
                  onDelete={handleDeleteMasterMaterial}
                  onImportBase={handleImportMasterMaterials}
                  canEdit={profile.role !== 'viewer'}
                />
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
          <InventoryView 
            item={viewingItem}
            onClose={() => setViewingItem(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFormOpen && (
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
        )}
      </AnimatePresence>

      {/* Vistoria Form Modal */}
      <AnimatePresence>
        {viewingVistoria && (
          <VistoriaRFView 
            item={viewingVistoria}
            onClose={() => setViewingVistoria(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVistoriaFormOpen && (
          <VistoriaRFForm 
            item={editingVistoria} 
            onClose={() => {
              setIsVistoriaFormOpen(false);
              setEditingVistoria(null);
              setSaveError(null);
            }} 
            onSave={handleSaveVistoria}
            isSaving={isSaving}
            saveError={saveError}
          />
        )}
      </AnimatePresence>

      {/* User Form Modal */}
      <AnimatePresence>
        {isUserFormOpen && (
          <UserForm 
            onClose={() => setIsUserFormOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
