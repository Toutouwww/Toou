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
                    baseUrl: 'https://api2.qiandao.mom/v1', apiKey: '', model: '[千岛-C Cli]gemini-3.1-pro-preview',
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
    } catch (e) { console.error("Load Base Error", e); }
}

// 🌟 性能大优化：DOM 加载完成后立刻执行并发请求
document.addEventListener('DOMContentLoaded', loadBaseData);
