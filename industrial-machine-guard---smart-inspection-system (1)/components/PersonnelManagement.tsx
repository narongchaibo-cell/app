
import React, { useState, useMemo, useRef } from 'react';
import { Personnel, PersonnelRole, UserRole } from '../types';

interface PersonnelManagementProps {
  personnel: Personnel[];
  departments: string[];
  onAdd: (p: Personnel) => void;
  onUpdate: (p: Personnel) => void;
  onDelete: (id: string) => void;
  onAddDept: (dept: string) => void;
  onUpdateDept: (oldName: string, newName: string) => void;
  onDeleteDept: (dept: string) => void;
  userRole: UserRole;
}

const PersonnelManagement: React.FC<PersonnelManagementProps> = ({ 
  personnel, departments, onAdd, onUpdate, onDelete, 
  onAddDept, onUpdateDept, onDeleteDept, userRole 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptInput, setNewDeptInput] = useState('');
  const [editingDeptName, setEditingDeptName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null);
  const [title, setTitle] = useState('นาย');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<PersonnelRole>(PersonnelRole.OPERATOR);
  const [info, setInfo] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const isAdmin = userRole === UserRole.ADMIN;

  const filteredPersonnel = useMemo(() => {
    return personnel.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.info.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.phone && p.phone.includes(searchTerm));
      const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [personnel, searchTerm, roleFilter]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("ขนาดไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 1MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setEditingPersonnel(null);
    setTitle('นาย');
    setFirstName('');
    setLastName('');
    setPhone('');
    setInfo('');
    setRole(PersonnelRole.OPERATOR);
    setAvatarUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName || !cleanLastName || !info.trim()) {
      return alert('กรุณากรอก ชื่อ, นามสกุล และเลือกแผนกให้ครบถ้วน');
    }

    const fullName = `${title}${cleanFirstName} ${cleanLastName}`;

    const personnelData = {
      name: fullName,
      title: title,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phone: phone.trim(),
      role,
      info,
      avatarUrl
    };

    if (editingPersonnel) {
      onUpdate({ ...editingPersonnel, ...personnelData });
    } else {
      onAdd({
        id: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...personnelData
      });
    }
    
    resetForm();
  };

  const handleEdit = (p: Personnel) => {
    if (!isAdmin) return;
    if (deletingId === p.id) return;
    
    setDeletingId(null);
    setEditingPersonnel(p);
    
    if (p.firstName && p.lastName) {
      setTitle(p.title || 'นาย');
      setFirstName(p.firstName);
      setLastName(p.lastName);
    } else {
      // Fallback สำหรับข้อมูลแบบเก่าที่เก็บแค่ Name
      const rawName = p.name.trim();
      let detectedTitle = 'นาย';
      let remainingName = rawName;

      if (rawName.startsWith('นางสาว')) {
        detectedTitle = 'นางสาว';
        remainingName = rawName.substring(6);
      } else if (rawName.startsWith('นาง')) {
        detectedTitle = 'นาง';
        remainingName = rawName.substring(3);
      } else if (rawName.startsWith('นาย')) {
        detectedTitle = 'นาย';
        remainingName = rawName.substring(3);
      }

      const parts = remainingName.trim().split(/\s+/);
      setTitle(detectedTitle);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
    }
    
    setPhone(p.phone || '');
    setRole(p.role);
    setInfo(p.info);
    setAvatarUrl(p.avatarUrl);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRoleBadge = (role: PersonnelRole) => {
    switch (role) {
      case PersonnelRole.ENGINEER: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case PersonnelRole.SUPERVISOR: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const handleAddOrUpdateDept = () => {
    const trimmedInput = newDeptInput.trim();
    if (!trimmedInput) return;

    if (editingDeptName) {
      onUpdateDept(editingDeptName, trimmedInput);
      setEditingDeptName(null);
    } else {
      if (departments.includes(trimmedInput)) {
        alert('ชื่อแผนกนี้มีอยู่ในระบบแล้ว');
        return;
      }
      onAddDept(trimmedInput);
    }
    setNewDeptInput('');
  };

  const startEditDept = (name: string) => {
    setEditingDeptName(name);
    setNewDeptInput(name);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-prompt animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">👥</div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">ทำเนียบบุคลากร</h2>
              <p className="text-slate-400 text-sm font-medium">จัดการรายชื่อพนักงานและข้อมูลติดต่อ</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-4 border-r border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Staff</p>
              <p className="text-2xl font-black text-slate-800">{personnel.length}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Departments</p>
              <p className="text-2xl font-black text-blue-600">{departments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-center">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1">Personnel Console</p>
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-lg">{isAdmin ? 'โหมดบริหารจัดการ' : 'โหมดดูข้อมูล'}</h4>
            {isAdmin && (
              <button 
                onClick={() => setIsDeptModalOpen(true)}
                className="text-[10px] font-black uppercase bg-indigo-600 hover:bg-white hover:text-indigo-950 px-4 py-2.5 rounded-xl transition-all shadow-lg active:scale-95"
              >
                จัดการแผนก ⚙️
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {isAdmin && (
          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-blue-50 sticky top-28 transition-all">
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                <span className="text-indigo-600">{editingPersonnel ? '✏️' : '➕'}</span>
                {editingPersonnel ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col items-center gap-4 mb-2">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center relative group cursor-pointer overflow-hidden transition-all hover:border-blue-400 shadow-inner"
                  >
                    {avatarUrl ? <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-3xl">📸</span>}
                    <div className="absolute inset-0 bg-blue-600/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest">Change</span>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PROFILE PICTURE</p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อ</label>
                  <div className="grid grid-cols-12 gap-2">
                    <select 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="col-span-4 px-2 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none font-bold text-slate-700 transition-all text-xs cursor-pointer"
                    >
                      <option value="นาย">นาย</option>
                      <option value="นาง">นาง</option>
                      <option value="นางสาว">นางสาว</option>
                    </select>
                    <input 
                      type="text" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      className="col-span-8 px-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all" 
                      placeholder="ระบุชื่อ..." 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">นามสกุล</label>
                  <input 
                    type="text" 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all" 
                    placeholder="ระบุนามสกุล..." 
                    required 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all" placeholder="08x-xxx-xxxx" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ตำแหน่งงาน</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as PersonnelRole)} className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-slate-700 cursor-pointer transition-all">
                    {Object.values(PersonnelRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5 relative">
                  <div className="flex justify-between items-center mb-1.5 pr-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">แผนก / ZONE</label>
                    {isAdmin && (
                      <button 
                        type="button" 
                        onClick={() => setIsDeptModalOpen(true)}
                        className="text-[10px] text-indigo-600 hover:text-black font-black flex items-center gap-1 transition-colors"
                      >
                        จัดการ ⚙️
                      </button>
                    )}
                  </div>
                  <select 
                    value={info} 
                    onChange={(e) => setInfo(e.target.value)} 
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all cursor-pointer shadow-sm"
                    required
                  >
                    <option value="">-- เลือกแผนก --</option>
                    {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    {info && !departments.includes(info) && <option value={info}>{info} (ข้อมูลเดิม)</option>}
                  </select>
                  {departments.length === 0 && <p className="mt-1 text-[8px] text-rose-500 font-bold animate-pulse">! โปรดเพิ่มแผนกก่อนใช้งาน</p>}
                </div>

                <div className="pt-4 space-y-3">
                  <button type="submit" disabled={departments.length === 0 && !info} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed">
                    {editingPersonnel ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มเข้าระบบ'}
                  </button>
                  {editingPersonnel && (
                    <button type="button" onClick={resetForm} className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">ยกเลิก</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={isAdmin ? "lg:col-span-8 space-y-6" : "lg:col-span-12 space-y-6"}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อ, แผนก หรือเบอร์โทร..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-slate-700 transition-all shadow-sm" 
              />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-6 py-4 rounded-2xl bg-white border border-slate-200 font-bold text-slate-600 outline-none shadow-sm cursor-pointer">
              <option value="ALL">ทุกตำแหน่ง</option>
              {Object.values(PersonnelRole).map(r => <option key={r} value={r}>{r.split('/')[0]}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPersonnel.map((p) => (
              <div 
                key={p.id} 
                onClick={() => handleEdit(p)}
                className={`bg-white p-6 rounded-[2rem] border-2 transition-all group flex flex-col justify-center min-h-[120px] shadow-sm cursor-pointer relative ${
                  editingPersonnel?.id === p.id ? 'border-blue-500 ring-4 ring-blue-50 bg-blue-50/10' : 
                  deletingId === p.id ? 'border-rose-300 bg-rose-50' : 'border-transparent hover:border-blue-100 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-5 flex-1 overflow-hidden">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-inner overflow-hidden ${deletingId === p.id ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-indigo-600 group-hover:bg-indigo-50 transition-colors'}`}>
                      {p.avatarUrl ? <img src={p.avatarUrl} alt={p.name} className="w-full h-full object-cover" /> : (p.name?.charAt(0) || 'U')}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-black text-slate-800 tracking-tight truncate group-hover:text-indigo-600 transition-colors">{p.name || 'Unknown Staff'}</h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border whitespace-nowrap ${getRoleBadge(p.role)}`}>
                          {p.role?.split('/')[0] || 'Unknown'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 truncate">| {p.info}</span>
                        {p.phone && <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">📞 {p.phone}</span>}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 ml-4">
                      {deletingId !== p.id ? (
                        <>
                          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">✏️</div>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setDeletingId(p.id); }} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-400 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm">🗑️</button>
                        </>
                      ) : (
                        <div className="flex flex-col gap-1 z-10">
                          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(p.id); setDeletingId(null); }} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase shadow-lg">ยืนยัน</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="px-3 py-1.5 bg-white border text-slate-600 rounded-lg text-[9px] font-black uppercase">ยกเลิก</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredPersonnel.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">ไม่พบรายชื่อบุคลากรที่ค้นหา</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Management Modal - Admin Only */}
      {isDeptModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-in fade-in zoom-in-95 duration-200">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
              <div className="p-8 bg-[#1E1B4B] text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black">จัดการรายชื่อแผนก</h3>
                    <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest">Admin Control Module</p>
                 </div>
                 <button onClick={() => { setIsDeptModalOpen(false); setEditingDeptName(null); setNewDeptInput(''); }} className="text-white/60 hover:text-white text-2xl">✕</button>
              </div>
              
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {editingDeptName ? `กำลังแก้ไขแผนก: ${editingDeptName}` : 'เพิ่มแผนกใหม่เข้าสู่ระบบ'}
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newDeptInput}
                        onChange={(e) => setNewDeptInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddOrUpdateDept()}
                        placeholder="ระบุชื่อแผนก..."
                        className="flex-1 px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-indigo-400 focus:bg-white font-bold text-sm shadow-inner transition-all"
                      />
                      <button 
                        onClick={handleAddOrUpdateDept}
                        className={`px-6 py-4 text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all active:scale-95 ${editingDeptName ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-black'}`}
                      >
                        {editingDeptName ? 'บันทึก' : 'เพิ่ม'}
                      </button>
                    </div>
                    {editingDeptName && (
                       <button 
                         onClick={() => { setEditingDeptName(null); setNewDeptInput(''); }}
                         className="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors"
                       >
                         ยกเลิกการแก้ไข
                       </button>
                    )}
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รายการแผนกปัจจุบัน ({departments.length})</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2 pb-2">
                      {departments.length > 0 ? departments.map((dept, idx) => (
                        <div key={idx} className="flex justify-between items-center p-5 bg-white rounded-2xl border border-slate-100 group transition-all hover:bg-slate-50 hover:border-indigo-100 shadow-sm">
                           <span className="font-bold text-slate-800 text-sm">{dept}</span>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => startEditDept(dept)}
                                className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center text-xs shadow-sm"
                                title="แก้ไขชื่อแผนก"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => {
                                  if(confirm(`ต้องการลบแผนก "${dept}" หรือไม่?\n*พนักงานที่เลือกแผนกนี้ไว้อยู่จะยังมีข้อมูลเดิมอยู่ แต่ชื่อแผนกจะไม่อยู่ในตัวเลือกใหม่`)) onDeleteDept(dept);
                                }}
                                className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center text-xs shadow-sm"
                                title="ลบแผนก"
                              >
                                🗑️
                              </button>
                           </div>
                        </div>
                      )) : (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">ไม่มีข้อมูลแผนกในระบบ</p>
                        </div>
                      )}
                    </div>
                 </div>

                 <button 
                  onClick={() => { setIsDeptModalOpen(false); setEditingDeptName(null); setNewDeptInput(''); }}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                 >
                   ปิดหน้าต่างจัดการ
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PersonnelManagement;
