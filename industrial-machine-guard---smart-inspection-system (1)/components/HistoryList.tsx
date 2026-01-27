import React, { useState, useMemo, useRef } from 'react';
import { InspectionRecord, MachineStatus, ApprovalStatus, UserRole, Personnel, User, PersonnelRole } from '../types';

interface HistoryListProps {
  records: InspectionRecord[];
  machines: any[];
  personnel: Personnel[];
  onEditRecord: (record: InspectionRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  user: User;
}

const HistoryList: React.FC<HistoryListProps> = ({ records, machines, personnel, onEditRecord, onDeleteRecord, user }) => {
  const [selectedRecord, setSelectedRecord] = useState<InspectionRecord | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // สิทธิ์จัดการ: แอดมิน, หัวหน้ากะ, และวิศวกร มีสิทธิ์จัดการข้อมูล (แก้ไข/ลบ)
  const canManage = useMemo(() => {
    if (!user) return false;
    return user.role === UserRole.ADMIN || 
           user.personnelRole === PersonnelRole.SUPERVISOR || 
           user.personnelRole === PersonnelRole.ENGINEER;
  }, [user]);

  const getMachineName = (id: string) => machines.find(m => m.id === id)?.name || id;

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = (d.getFullYear() + 543).toString().slice(-2);
    
    return {
      date: `${day} ${month} ${year}`,
      time: d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
    };
  };

  const filteredRecords = useMemo(() => {
    return [...records]
      .filter(r => !r.deletedAt)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records]);

  // แก้ไขส่วนการลบ: ให้พิมพ์ชื่อผู้ใช้งานเพื่อยืนยัน
  const handleDeleteClick = (e: React.MouseEvent, recordId: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    if (!canManage) return;
    
    const confirmationText = user.name;
    const userInput = window.prompt(`⚠️ ยืนยันการลบรายงานรหัส ${recordId}\nกรุณาพิมพ์ชื่อของคุณ "${confirmationText}" เพื่อยืนยันการลบ:`);
    
    if (userInput === confirmationText) {
      onDeleteRecord(recordId);
    } else if (userInput !== null) {
      alert('ชื่อไม่ถูกต้อง การลบถูกยกเลิก');
    }
  };

  // แก้ไขส่วนการลบจากหน้า Detail: ให้พิมพ์ชื่อผู้ใช้งานเพื่อยืนยัน
  const handleDeleteFromDetail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedRecord || !canManage) return;
    const recordId = selectedRecord.id;
    const confirmationText = user.name;
    
    const userInput = window.prompt(`⚠️ ยืนยันการลบรายงานนี้ออกจากระบบ\nกรุณาพิมพ์ชื่อของคุณ "${confirmationText}" เพื่อยืนยัน:`);
    
    if (userInput === confirmationText) {
      // ปิด Modal ทันที
      setSelectedRecord(null);
      // ส่งคำสั่งลบ
      onDeleteRecord(recordId);
    } else if (userInput !== null) {
      alert('ชื่อไม่ถูกต้อง การลบถูกยกเลิก');
    }
  };

  const handleEditClick = (e: React.MouseEvent, record: InspectionRecord) => {
    e.preventDefault();
    e.stopPropagation();
    if (canManage) {
      onEditRecord(record);
    }
  };

  const handleDownloadPDF = async (e: React.MouseEvent) => { 
    e.preventDefault();
    e.stopPropagation();
    if (!selectedRecord || !reportRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const element = reportRef.current;
      const opt = {
        margin: [15, 18, 15, 18], 
        filename: `TMC_Report_${selectedRecord.id}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 4, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // @ts-ignore
      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("PDF Export Error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 font-prompt animate-in fade-in duration-500">
      <div className="flex justify-between items-end px-2 mb-6">
        <div>
           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">TMC Operation Console</p>
           <h3 className="text-4xl font-black text-slate-800">ประวัติ</h3>
        </div>
        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             TOTAL LOGS: <span className="text-indigo-600 font-black">{filteredRecords.length}</span>
           </p>
        </div>
      </div>

      <div className="px-2 mb-8">
        <h4 className="text-lg font-bold text-slate-700">ประวัติการตรวจล่าสุด</h4>
      </div>

      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRecords.map((record) => {
            const dt = formatDateTime(record.date);
            const machineShortId = record.machineId.split('-')[0];
            
            return (
              <div 
                key={record.id} 
                onClick={() => setSelectedRecord(record)} 
                className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#2563EB] font-black text-xl">
                    {machineShortId}
                  </div>
                  <div className={`px-5 py-2 rounded-full text-[12px] font-black border transition-colors ${
                    record.overallStatus === MachineStatus.OPERATIONAL 
                      ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]' 
                      : record.overallStatus === MachineStatus.WARNING 
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]'
                  }`}>
                    {record.overallStatus}
                  </div>
                </div>

                <h4 className="text-2xl font-black text-slate-900 mb-6 tracking-tight group-hover:text-[#2563EB] transition-colors">
                  {getMachineName(record.machineId)}
                </h4>

                <div className="space-y-4 mb-4">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">🗓️</span>
                    {dt.date}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                    <span className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">🕒</span>
                    {dt.time}
                  </div>
                </div>

                {canManage && (
                  <div className="absolute bottom-10 right-10 flex gap-4 z-20">
                    <button 
                      onClick={(e) => handleEditClick(e, record)} 
                      className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(37,99,235,0.5)] hover:scale-110 transition-all active:scale-95 border-4 border-white"
                      title="แก้ไขข้อมูล"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={(e) => handleDeleteClick(e, record.id)} 
                      className="w-14 h-14 rounded-full bg-[#E11D48] text-white flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(225,29,72,0.5)] hover:scale-110 transition-all active:scale-95 border-4 border-white"
                      title="ลบข้อมูล"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="text-6xl mb-6 opacity-20 grayscale">📜</div>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">ยังไม่มีข้อมูลประวัติการตรวจเช็คในระบบ</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-[#1E1B4B] p-8 text-white flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="z-10">
                <h3 className="text-xl font-black">รายละเอียดรายงาน</h3>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">REF ID: {selectedRecord.id}</p>
              </div>
              
              <div className="flex gap-4 items-center z-10">
                {canManage && (
                  <button 
                    onClick={handleDeleteFromDetail} 
                    className="h-12 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20 active:scale-95 flex items-center justify-center gap-2 border border-rose-400"
                    title="ลบรายงานนี้"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    ลบรายงานนี้
                  </button>
                )}
                
                <button 
                  onClick={handleDownloadPDF} 
                  className="h-12 px-8 bg-[#5445FF] hover:bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="text-lg">📥</span>
                  {isDownloading ? 'GENERATING...' : 'DOWNLOAD PDF'}
                </button>
                
                <button 
                  onClick={() => setSelectedRecord(null)} 
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center justify-center text-xl"
                >✕</button>
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-50 space-y-8 custom-scrollbar" ref={reportRef}>
               <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MACHINE PROFILE</p>
                    <p className="text-2xl font-black text-slate-900">{getMachineName(selectedRecord.machineId)}</p>
                    <p className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">ID: {selectedRecord.machineId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">INSPECTION DATE</p>
                    <p className="text-lg font-bold text-slate-700">{formatDateTime(selectedRecord.date).date}</p>
                    <p className="text-xs font-bold text-slate-400">{formatDateTime(selectedRecord.date).time}</p>
                  </div>
               </div>

               <div className="space-y-4">
                 <div className="flex items-center gap-2 ml-1">
                    <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CHECKLIST RESULT DETAILS</h5>
                 </div>
                 <div className="grid grid-cols-1 gap-4">
                   {selectedRecord.sections.map(sec => (
                     <div key={sec.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h6 className="font-black text-indigo-600 mb-6 flex items-center gap-2">
                           <span className="text-lg">🔘</span> {sec.title}
                        </h6>
                        <div className="space-y-4">
                          {sec.items.map(item => {
                            const val = selectedRecord.values[item.id];
                            let statusText = '-';
                            let statusColor = 'text-slate-900';
                            let itemNote = '';
                            
                            if (val && typeof val === 'object') {
                              statusText = val.status || '-';
                              statusColor = val.status === 'NORMAL' ? 'text-emerald-500' : val.status === 'WARNING' ? 'text-amber-500' : 'text-rose-500';
                              itemNote = val.note || '';
                            } else if (typeof val === 'boolean') {
                              statusText = val ? 'NORMAL' : 'ABNORMAL';
                              statusColor = val ? 'text-emerald-500' : 'text-rose-500';
                            } else {
                              statusText = val ? `${val} ${item.unit || ''}` : '-';
                            }

                            return (
                              <div key={item.id} className="py-4 border-b border-slate-50 last:border-0">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-bold text-slate-600">{item.label}</span>
                                  <span className={`text-sm font-black uppercase ${statusColor} bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 shadow-inner`}>
                                    {statusText}
                                  </span>
                                </div>
                                {itemNote && (
                                  <div className="mt-3 px-5 py-3 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-2xl shadow-sm animate-in slide-in-from-left-2">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Issue Reported:</p>
                                    <p className="text-xs text-indigo-900 font-medium leading-relaxed italic">"{itemNote}"</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                     </div>
                   ))}
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { role: 'OPERATOR', name: selectedRecord.operatorName, sign: selectedRecord.operatorSignature },
                   { role: 'SUPERVISOR', name: selectedRecord.supervisorName, sign: selectedRecord.supervisorSignature },
                   { role: 'ENGINEER', name: selectedRecord.engineerName, sign: selectedRecord.engineerSignature }
                 ].map((p, i) => (
                   <div key={i} className="bg-white p-6 rounded-[2.2rem] border border-slate-100 flex flex-col items-center text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{p.role}</p>
                      <div className="w-full h-24 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100 overflow-hidden">
                        {p.sign ? <img src={p.sign} className="max-h-full" alt="signature" /> : <span className="text-slate-300 text-xs italic">No signature</span>}
                      </div>
                      <p className="font-bold text-slate-800 text-sm truncate w-full">{p.name || '-'}</p>
                   </div>
                 ))}
               </div>

               {selectedRecord.notes && (
                 <div className="space-y-4">
                   <div className="flex items-center gap-2 ml-1">
                      <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SUMMARY & GENERAL NOTES</h5>
                   </div>
                   <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative">
                      <span className="absolute top-4 right-6 text-4xl opacity-10 grayscale select-none">📝</span>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap italic relative z-10">
                        "{selectedRecord.notes}"
                      </p>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryList;