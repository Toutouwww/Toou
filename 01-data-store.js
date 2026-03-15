// ==========================================
// 01-data-store.js: 数据状态管理与初始化
// ==========================================

// ==========================================
// 1. 全局状态变量声明 (从原文件各处集中提取)
// ==========================================

// --- 个人资料相关 ---
let profilePlans = [];
let currentActivePlanId = 'default';
let currentTempPlan = {}; 

const baseDefaults = {
    avatar: 'https://i.pinimg.com/564x/bd/d9/39/bdd9392233f07a78c005b63001859942.jpg', 'text-profile-name': '某某', 'text-profile-sign': '编辑角色对你的专属备注',
    'text-detail-gender': '', 'text-detail-age': '', 'text-detail-birthday': '', 'text-detail-zodiac': '', 'text-detail-location': '',
    'text-tag-1': '', 'text-tag-2': '', 'text-tag-3': '', 'secret_mode': false, 'text-secret-file': ''
};

// --- 千岛 API 相关 ---
let apiPlans = [];
let selectedApiPlanId = null; 
let activeApiPlanId = null;   

// --- 世界书相关 ---
let activeWorldbooks = []; 
let bindedCharacters = []; 
let customCommonGroups = []; 
let currentCommonBoundChar = ''; 

// --- 通讯录与聊天相关 ---
let contactsList = [];
let msgCurrentTab = 'ALL';

// --- 自定义气泡相关 ---
let customBubblePlans = [];
let tempPreviewBubbleData = null; 

// --- 表情包相关 ---
let myStickers = [];
let stickerGroups = []; // 全局表情分组

async function loadStickersData() {
    try {
        const dbData = await db.settings.get('my_stickers_data');
        if (dbData && dbData.value) { 
            myStickers = JSON.parse(dbData.value); 
            // 旧版本数据兼容：强制归类到“通用”
            myStickers.forEach(s => { if(!s.group) s.group = '通用'; });
        }
        
        const grpData = await db.settings.get('sticker_groups_data');
        if (grpData && grpData.value) { stickerGroups = JSON.parse(grpData.value); }
        if (stickerGroups.length === 0) {
            stickerGroups = [{ id: 'sg_default', name: '通用', boundChars: [] }];
        }
    } catch (e) { console.error("表情包读取失败", e); }
}



// ==========================================
// 2. Dexie 数据库初始化与基础操作
// ==========================================
const db = new Dexie("QianDaoPhoneDB");
db.version(2).stores({ settings: '&key, value', assets: '&key, data' });

async function requestPersistence() { 
    if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); 
}
requestPersistence();

async function saveToDB(key, val) { 
    try { await db.settings.put({ key: key, value: val }); } catch(e) {} 
}

function hardReset() { 
    if(confirm('警告：這將會刪除所有本地数据！')) { 
        db.delete().then(() => { location.reload(); }); 
    } 
}


// ==========================================
// 3. 各模块数据加载引擎 (Loaders)
// ==========================================

// 加载个人资料方案
async function loadPlans() {
    try {
        const dbPlans = await db.settings.get('profile_plans');
        if (dbPlans && dbPlans.value) {
            profilePlans = JSON.parse(dbPlans.value);
            if(!profilePlans.find(p => p.id === 'default')) profilePlans.unshift({ id: 'default', name: '我的个人介绍', data: { ...baseDefaults } });
        } else { profilePlans = [{ id: 'default', name: '我的个人介绍', data: { ...baseDefaults } }]; }
        
        const dbActiveId = await db.settings.get('active_plan_id');
        if (dbActiveId && dbActiveId.value) currentActivePlanId = dbActiveId.value; else currentActivePlanId = 'default';

        const dbTemp = await db.settings.get('temp_profile_plan');
        if (dbTemp && dbTemp.value) {
            currentTempPlan = { ...baseDefaults, ...JSON.parse(dbTemp.value) }; 
            syncViewFromTempPlan(); // 注意：依赖于 02-ui-components.js
            const p = profilePlans.find(p => p.id === currentActivePlanId);
            if(p) document.getElementById('current-plan-name').innerText = p.name; else document.getElementById('current-plan-name').innerText = "未命名方案";
        } else { applyPlan(currentActivePlanId); } // 注意：依赖于 02-ui-components.js
    } catch(e) { console.error("Plan Load Error", e); }
}

// 加载千岛 API 方案
async function loadApiPlansData() {
    try {
        const dbPlans = await db.settings.get('qiandao_api_plans');
        if (dbPlans && dbPlans.value) {
            apiPlans = JSON.parse(dbPlans.value);
        }
        
        if (apiPlans.length === 0) {
            const defaultPlan = {
                id: 'api_plan_' + Date.now(),
                name: '默认配置',
                data: {
                    baseUrl: 'https://api2.qiandao.mom/v1', apiKey: '', model: '[千岛-自营]gemini-3.1-pro-preview',
                    temp: '1.0', freq: '0.0', pres: '0.0', topp: '0.9', stream: false
                }
            };
            apiPlans.push(defaultPlan);
            await saveToDB('qiandao_api_plans', JSON.stringify(apiPlans));
        }

        const dbActive = await db.settings.get('active_api_plan_id');
        if (dbActive && dbActive.value) { activeApiPlanId = dbActive.value; } 
        else { activeApiPlanId = apiPlans[0].id; await saveToDB('active_api_plan_id', activeApiPlanId); }

        renderApiPlanDropdown(); // 注意：依赖于 03-api-chat.js
        
        const currentPlan = apiPlans.find(p => p.id === activeApiPlanId) || apiPlans[0];
        selectedApiPlanId = currentPlan.id; 
        document.getElementById('api-plan-input').value = currentPlan.name;
        syncUIWithApiPlanData(currentPlan.data); // 注意：依赖于 03-api-chat.js
    } catch(e) { console.error("API Plan Load Error", e); }
}

// 加载世界书数据与重算分类
async function loadWorldbooksData() {
    try {
        const dbWb = await db.settings.get('worldbooks_data');
        if (dbWb && dbWb.value) {
            activeWorldbooks = JSON.parse(dbWb.value);
            recalcCategories(); // 恢复内存数据联动
        }
    } catch(e) { console.error("Load WB Data Error", e); }
}

function recalcCategories() {
    bindedCharacters = []; customCommonGroups = [];
    activeWorldbooks.forEach(b => {
        if (b.category === '专属' && !bindedCharacters.includes(b.subGroup)) bindedCharacters.push(b.subGroup);
        else if (b.category === '通用' && !customCommonGroups.includes(b.subGroup)) customCommonGroups.push(b.subGroup);
    });
}

// 加载通讯录与聊天记录
async function loadContactsData() {
    try {
        const dbData = await db.settings.get('contacts_data');
        if (dbData && dbData.value) { contactsList = JSON.parse(dbData.value); }
        renderMsgList();           // 注意：依赖于 03-api-chat.js
        updateProfileAvatars();    // 注意：依赖于 02-ui-components.js
    } catch (e) { console.error("通讯录读取失败", e); }
}

// 加载表情包数据
async function loadStickersData() {
    try {
        const dbData = await db.settings.get('my_stickers_data');
        if (dbData && dbData.value) { myStickers = JSON.parse(dbData.value); }
    } catch (e) { console.error("表情包读取失败", e); }
}


// 加载自定义气泡美化方案
async function loadCustomBubblePlans() {
    try {
        const dbData = await db.settings.get('custom_bubble_plans');
        if (dbData && dbData.value) {
            customBubblePlans = JSON.parse(dbData.value);
        }
        
        const activeCss = await db.settings.get('custom_bubble_css');
        if (activeCss && activeCss.value) {
            let styleEl = document.getElementById('dynamic-bubble-css');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'dynamic-bubble-css';
                document.head.appendChild(styleEl);
            }
            styleEl.innerHTML = activeCss.value;
            document.querySelectorAll('.bubble-theme-item').forEach(el => el.classList.remove('active'));
        }
    } catch(e) { console.error("读取气泡方案失败", e); }
}
// 原逻辑中独立绑定的加载事件
window.addEventListener('load', loadCustomBubblePlans);


// ==========================================
// 4. 全局超级初始化入口 (开机动作)
// ==========================================
async function loadBaseData() {
    try {
        // 🌟 性能大优化：使用 Promise.all 让四个数据库读取任务同时进行
        await Promise.all([
            loadPlans(),
            loadApiPlansData(),
            loadWorldbooksData(),
            loadContactsData(), // 🌟 修复Bug：补上了这里遗漏的致命逗号
            loadStickersData()
        ]);


        const dbGlobal = await db.settings.get('global_applied_profile');
        if (dbGlobal && dbGlobal.value) {
            updateSidebarProfile(dbGlobal.value); // 注意：依赖于 02-ui-components.js
        } else {
            updateSidebarProfile('default');
        }
        
        const settings = await db.settings.toArray();
        settings.forEach(item => {
            if(item.key.startsWith('color_')) { 
                const pureName = item.key.replace('color_', '');
                document.documentElement.style.setProperty(`--${pureName}`, item.value); 
            } 
            else if(item.key.startsWith('text_')) {
                if (['text_profile-name', 'text_profile-sign', 'text_secret-file'].includes(item.key) || item.key.startsWith('text_detail-') || item.key.startsWith('text_tag-')) return;
                const el = document.getElementById(`text-${item.key.replace('text_', '')}`) || document.getElementById(item.key.replace('text_', ''));
                if(el) el.innerText = item.value;
            }
        });

        const assets = await db.assets.toArray();
        assets.forEach(item => {
            if(item.key === 'bg_image_data') { 
                document.body.style.backgroundImage = `url(${item.data})`; 
                document.body.style.backgroundSize = "cover"; 
            } 
            else if (item.key === 'global_avatar') { 
                ['img-main-avatar', 'img-chat-avatar', 'img-blog-avatar'].forEach(id => { 
                    const el = document.getElementById(id); 
                    if(el) el.src = item.data; 
                }); 
            } 
            else { 
                const el = document.getElementById(item.key); 
                if(el && el.id !== 'img-profile-avatar' && el.id !== 'img-sidebar-avatar') el.src = item.data; 
            }
        });
        // 🌟 读取 icity 日记自定义文案
        const icityContent = await db.settings.get('icity_custom_content');
        if (icityContent && icityContent.value) {
            const el = document.getElementById('icity-content-display');
            if (el) el.innerText = icityContent.value;
        }
    } catch (e) { console.error("Load Base Error", e); }
}

// 🌟 性能大优化：DOM 加载完成后立刻执行并发请求
document.addEventListener('DOMContentLoaded', loadBaseData);


// ==========================================
// 5. 备份、恢复与数据管理引擎 (Data Manager)
// ==========================================

function formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024, dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function checkStorageHealth() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const percent = quota > 0 ? (usage / quota) * 100 : 0;
            
            const textEl = document.getElementById('storage-text');
            const barEl = document.getElementById('storage-bar');
            if (textEl && barEl) {
                textEl.innerText = `${formatBytes(usage)} / ${formatBytes(quota)}`;
                barEl.style.width = `${percent.toFixed(1)}%`;
                // 超量变红，良好变黑
                if (percent > 80) barEl.style.background = '#ff3b30';
                else if (percent > 50) barEl.style.background = '#ffcc00';
                else barEl.style.background = '#111';
            }
        } catch (e) {}
    }
}

function openDataModal() {
    document.getElementById('dataManageOverlay').classList.add('active');
    checkStorageHealth(); // 每次打开计算一次
}
function closeDataModal() {
    document.getElementById('dataManageOverlay').classList.remove('active');
}

function downloadJsonFile(obj, filename) {
    const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 🌟 全量导出
async function exportBackup() {
    showToast('正在全量打包，请稍候...');
    try {
        const allSettings = await db.settings.toArray();
        const allAssets = await db.assets.toArray();
        const backupData = {
            version: "3.1", type: "full_backup", timestamp: new Date().toISOString(),
            settings: allSettings, assets: allAssets
        };
        downloadJsonFile(backupData, `Toutou_Backup_${new Date().toISOString().slice(0,10)}.json`);
        closeDataModal();
    } catch(e) { showToast("导出失败: " + e.message); }
}

// 🌟 仅导出聊天记录
async function exportChatsOnly() {
    showToast('正在打包聊天记录...');
    try {
        const chatsRow = await db.settings.get('contacts_data');
        const backupData = {
            version: "3.1", type: "chats_only", timestamp: new Date().toISOString(),
            contacts_data: chatsRow ? chatsRow.value : "[]"
        };
        downloadJsonFile(backupData, `Toutou_Chats_${new Date().toISOString().slice(0,10)}.json`);
        closeDataModal();
    } catch(e) { showToast("导出失败: " + e.message); }
}

// 🌟 智能分卷导出（防止爆内存崩溃）
async function exportSmartBackup() {
    showToast('正在进行智能分卷...');
    try {
        const allSettings = await db.settings.toArray();
        const allAssets = await db.assets.toArray();
        
        // Part 1: System 配置包 (剔除联系人和表情包)
        const sysSettings = allSettings.filter(s => s.key !== 'contacts_data' && s.key !== 'my_stickers_data');
        downloadJsonFile({ type: 'system_split', settings: sysSettings, assets: allAssets }, `Toutou_P1_Sys.json`);
        await new Promise(r => setTimeout(r, 1200));
        
        // Part 2: Stickers 表情包
        const stickersRow = allSettings.find(s => s.key === 'my_stickers_data');
        if (stickersRow) {
            downloadJsonFile({ type: 'stickers_split', my_stickers_data: stickersRow.value }, `Toutou_P2_Stickers.json`);
            await new Promise(r => setTimeout(r, 1200));
        }
        
        // Part 3: Chats 聊天包（自动动态切割阈值 20MB）
        const chatsRow = allSettings.find(s => s.key === 'contacts_data');
        if (chatsRow) {
            let chats = JSON.parse(chatsRow.value);
            let currentChunk = []; let currentSize = 0; let partIndex = 3;
            for (let i=0; i<chats.length; i++) {
                let chatSize = JSON.stringify(chats[i]).length;
                if (currentSize + chatSize > 20 * 1024 * 1024 && currentChunk.length > 0) {
                    downloadJsonFile({ type: 'chats_split', contacts_data: JSON.stringify(currentChunk) }, `Toutou_P${partIndex}_Chats.json`);
                    partIndex++; currentChunk = []; currentSize = 0;
                    await new Promise(r => setTimeout(r, 1200));
                }
                currentChunk.push(chats[i]); currentSize += chatSize;
            }
            if (currentChunk.length > 0) {
                downloadJsonFile({ type: 'chats_split', contacts_data: JSON.stringify(currentChunk) }, `Toutou_P${partIndex}_Chats.json`);
            }
        }
        showToast("智能分卷导出完成");
        closeDataModal();
    } catch(e) { showToast("分卷失败: " + e.message); }
}

// 🌟 智能导入与合并恢复
async function handleImportFile(input) {
    const file = input.files[0];
    if (!file) return;
    if (confirm(`【准备导入: ${file.name}】\n\n数据将进行智能合并与覆盖更新，现有的其他数据不会丢失。\n\n确定要导入吗？`)) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.type === 'system_split') {
                    await db.transaction('rw', db.settings, db.assets, async () => {
                        if (data.settings) { for(let i of data.settings) await db.settings.put(i); }
                        if (data.assets) { for(let i of data.assets) await db.assets.put(i); }
                    });
                } else if (data.type === 'stickers_split') {
                    if (data.my_stickers_data) await db.settings.put({key: 'my_stickers_data', value: data.my_stickers_data});
                } else if (data.type === 'chats_split' || data.type === 'chats_only') {
                    if (data.contacts_data) {
                        const oldRow = await db.settings.get('contacts_data');
                        let oldChats = oldRow && oldRow.value ? JSON.parse(oldRow.value) : [];
                        let newChats = JSON.parse(data.contacts_data);
                        // 基于 ID 智能更新/追加
                        newChats.forEach(nc => {
                            let idx = oldChats.findIndex(oc => oc.id === nc.id);
                            if (idx > -1) oldChats[idx] = nc; else oldChats.push(nc);
                        });
                        await db.settings.put({key: 'contacts_data', value: JSON.stringify(oldChats)});
                    }
                } else if (data.type === 'full_backup' || data.settings) {
                    await db.transaction('rw', db.settings, db.assets, async () => {
                        if (data.settings) { for(let i of data.settings) await db.settings.put(i); }
                        if (data.assets) { for(let i of data.assets) await db.assets.put(i); }
                    });
                }
                alert(`导入成功！\n页面即将刷新应用更改`);
                location.reload();
            } catch(err) { alert("恢复失败，文件可能格式错误: " + err.message); }
        };
        reader.readAsText(file);
    }
    input.value = '';
}

// 🌟 生成全量压缩包 (ZIP)
async function exportZipBackup() {
    if (typeof JSZip === 'undefined') {
        showToast("组件正在加载中，请检查网络...");
        return;
    }
    showToast('正在为您打包 ZIP 压缩文件...');
    try {
        const zip = new JSZip();
        const allSettings = await db.settings.toArray();
        const allAssets = await db.assets.toArray();
        
        const backupData = {
            version: "3.1", type: "full_backup", timestamp: new Date().toISOString(),
            settings: allSettings, assets: allAssets
        };
        
        zip.file("Toutou_Data.json", JSON.stringify(backupData));
        
        // 压缩并生成文件
        const blob = await zip.generateAsync({type:"blob", compression: "DEFLATE"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; 
        a.download = `Toutou_ZipBackup_${new Date().toISOString().slice(0,10)}.zip`;
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        closeDataModal();
    } catch(e) { 
        showToast("生成压缩包失败: " + e.message); 
    }
}


// 🌟 智能导入与合并恢复 (支持 JSON 与 ZIP)
async function handleImportFile(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (confirm(`【准备导入: ${file.name}】\n\n数据将进行智能合并与覆盖更新，现有的其他数据不会丢失。\n\n确定要导入吗？`)) {
        
        try {
            let dataObj = null;
            
            // 🌟 如果是 ZIP 文件，走解压流程
            if (file.name.toLowerCase().endsWith('.zip')) {
                if (typeof JSZip === 'undefined') throw new Error("缺少解压组件，请检查网络连接");
                showToast("正在解压 ZIP 文件...");
                const zip = await JSZip.loadAsync(file);
                
                // 寻找里面的 json 文件
                const jsonFile = Object.values(zip.files).find(f => f.name.endsWith('.json'));
                if (!jsonFile) throw new Error("压缩包内未找到有效的数据文件");
                
                const jsonText = await jsonFile.async("string");
                dataObj = JSON.parse(jsonText);
            } else {
                // 🌟 原来的 JSON 文本读取流程
                const text = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result);
                    reader.onerror = e => reject(e);
                    reader.readAsText(file);
                });
                dataObj = JSON.parse(text);
            }
            
            // 下方是通用恢复合并逻辑
            const data = dataObj;
            if (data.type === 'system_split') {
                await db.transaction('rw', db.settings, db.assets, async () => {
                    if (data.settings) { for(let i of data.settings) await db.settings.put(i); }
                    if (data.assets) { for(let i of data.assets) await db.assets.put(i); }
                });
            } else if (data.type === 'stickers_split') {
                if (data.my_stickers_data) await db.settings.put({key: 'my_stickers_data', value: data.my_stickers_data});
            } else if (data.type === 'chats_split' || data.type === 'chats_only') {
                if (data.contacts_data) {
                    const oldRow = await db.settings.get('contacts_data');
                    let oldChats = oldRow && oldRow.value ? JSON.parse(oldRow.value) : [];
                    let newChats = JSON.parse(data.contacts_data);
                    newChats.forEach(nc => {
                        let idx = oldChats.findIndex(oc => oc.id === nc.id);
                        if (idx > -1) oldChats[idx] = nc; else oldChats.push(nc);
                    });
                    await db.settings.put({key: 'contacts_data', value: JSON.stringify(oldChats)});
                }
            } else if (data.type === 'full_backup' || data.settings) {
                await db.transaction('rw', db.settings, db.assets, async () => {
                    if (data.settings) { for(let i of data.settings) await db.settings.put(i); }
                    if (data.assets) { for(let i of data.assets) await db.assets.put(i); }
                });
            }
            alert(`导入成功！\n页面即将刷新应用更改`);
            location.reload();
            
        } catch (err) {
            alert("恢复失败，文件可能已损坏或格式错误: " + err.message);
        }
    }
    input.value = '';
}

// 🌟 暗黑系重置系统弹窗控制
function openResetModal() {
    document.getElementById('resetDataModalOverlay').classList.add('active');
}
function closeResetModal() {
    document.getElementById('resetDataModalOverlay').classList.remove('active');
}

// 🌟 彻底重置执行核心
async function executeResetAllData() {
    try {
        await db.delete();
        localStorage.clear();
        alert("已将数据彻底粉碎，世界重置中...");
        window.location.reload();
    } catch (err) { 
        alert("清除失败: " + err); 
    }
}
