// ==========================================
// 软件1：通讯应用软件的打开、关闭与标签切换
// ==========================================

function openAppChat(event) {
    const overlay = document.getElementById('appChatOverlay');
    if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;
        overlay.style.transformOrigin = `${originX}px ${originY}px`;
    } else {
        overlay.style.transformOrigin = 'center bottom';
    }
    overlay.classList.add('active');
}

function closeAppChat() {
    document.getElementById('appChatOverlay').classList.remove('active');
}

function switchTab(tabId, btnElement) {
    const buttons = document.querySelectorAll('.app-sidebar .nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if(btnElement.classList.contains('nav-btn')){
        btnElement.classList.add('active');
    }

    const tabs = document.querySelectorAll('.screen-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');

    const phoneWrapper = document.getElementById('phone-frame-wrapper');
    if (tabId === 'tab-profile') {
        phoneWrapper.style.display = 'none';
    } else {
        phoneWrapper.style.display = 'flex';
    }
}


// ==========================================
// 软件2：千岛 API 配置界面的逻辑
// ==========================================

function openApiApp(event) {
    const overlay = document.getElementById('apiAppOverlay');
    if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        const originX = rect.left + rect.width / 2;
        const originY = rect.top + rect.height / 2;
        overlay.style.transformOrigin = `${originX}px ${originY}px`;
    } else {
        overlay.style.transformOrigin = 'center center';
    }

    if (apiPlans && apiPlans.length > 0 && activeApiPlanId) {
        const appliedPlan = apiPlans.find(p => p.id === activeApiPlanId) || apiPlans[0];
        selectedApiPlanId = appliedPlan.id; 
        document.getElementById('api-plan-input').value = appliedPlan.name;
        syncUIWithApiPlanData(appliedPlan.data); 
        renderApiPlanDropdown(); 
    }

    overlay.classList.add('active');
}

function closeApiApp() {
    document.getElementById('apiAppOverlay').classList.remove('active');
}

// 全局 Toast 弹窗提示 
function showToast(msg) {
    let toast = document.getElementById('globalToast');
    if(!toast) {
        toast = document.createElement('div');
        toast.id = 'globalToast';
        toast.className = 'toast-msg';
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add('show');
    
    if(toast.timer) clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 1500); 
}

// 拉条实时显示数值
function updateSliderVal(sliderEl, valId) {
    let val = parseFloat(sliderEl.value);
    if (valId === 'val-topp') {
        let str = val.toFixed(2);
        if(str.endsWith('0')) str = str.slice(0, -1);
        document.getElementById(valId).innerText = str;
    } else {
        document.getElementById(valId).innerText = val.toFixed(1);
    }
}

function toggleStream() {
    const btn = document.getElementById('stream-toggle-btn');
    btn.classList.toggle('active');
}

function getCurrentApiUIData() {
    return {
        baseUrl: document.getElementById('api-base-url-input').value,
        apiKey: document.getElementById('api-key-input').value,
        model: document.getElementById('api-model-input').value,
        temp: document.getElementById('slider-temp').value,
        freq: document.getElementById('slider-freq').value,
        pres: document.getElementById('slider-pres').value,
        topp: document.getElementById('slider-topp').value,
        stream: document.getElementById('stream-toggle-btn').classList.contains('active')
    };
}

function syncUIWithApiPlanData(data) {
    if(data.baseUrl !== undefined) document.getElementById('api-base-url-input').value = data.baseUrl;
    if(data.apiKey !== undefined) document.getElementById('api-key-input').value = data.apiKey;
    if(data.model !== undefined) document.getElementById('api-model-input').value = data.model;
    
    if(data.temp !== undefined) { document.getElementById('slider-temp').value = data.temp; updateSliderVal(document.getElementById('slider-temp'), 'val-temp'); }
    if(data.freq !== undefined) { document.getElementById('slider-freq').value = data.freq; updateSliderVal(document.getElementById('slider-freq'), 'val-freq'); }
    if(data.pres !== undefined) { document.getElementById('slider-pres').value = data.pres; updateSliderVal(document.getElementById('slider-pres'), 'val-pres'); }
    if(data.topp !== undefined) { document.getElementById('slider-topp').value = data.topp; updateSliderVal(document.getElementById('slider-topp'), 'val-topp'); }
    
    const btn = document.getElementById('stream-toggle-btn');
    if(data.stream) btn.classList.add('active');
    else btn.classList.remove('active');
}

function toggleUrlMenu() {
    const menu = document.getElementById('urlDropdownMenu');
    menu.classList.toggle('active');
}

function selectUrl(url) {
    const input = document.getElementById('api-base-url-input');
    input.value = url;
    document.getElementById('urlDropdownMenu').classList.remove('active');
}

async function fetchModelList() {
    const baseUrl = document.getElementById('api-base-url-input').value;
    const apiKey = document.getElementById('api-key-input').value;
    
    if (!apiKey) { showToast("错误: 请先填写 API Key！"); return; }
    
    const btn = document.querySelector('.api-model-fetch-btn-mini');
    const oldText = btn.innerText;
    btn.innerText = '·';
    
    try {
        const response = await fetch(`${baseUrl}/models`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const msg = err.error?.message || err.message || response.statusText || "请求失败，请检查令牌或网络状态";
            showToast(`API报错: ${msg}`);
            btn.innerText = oldText; return;
        }
        
        const data = await response.json();
        if (data && data.data && Array.isArray(data.data)) {
            const models = data.data.map(m => m.id);
            showModelSelectModal(models);
        } else {
            showToast("错误: 接口返回数据不包含模型列表");
        }
    } catch (e) { showToast("网络请求失败: " + e.message); }
    btn.innerText = oldText;
}

function showModelSelectModal(models) {
    const container = document.getElementById('modelListContent');
    container.innerHTML = '';
    models.forEach(model => {
        const div = document.createElement('div');
        div.className = 'model-item-btn';
        div.innerText = model;
        div.onclick = () => {
            document.getElementById('api-model-input').value = model;
            closeModelList();
        };
        container.appendChild(div);
    });
    document.getElementById('modelListOverlay').classList.add('active');
}

function closeModelList() { document.getElementById('modelListOverlay').classList.remove('active'); }

let apiPlans = [];
let selectedApiPlanId = null; 
let activeApiPlanId = null;   

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

        renderApiPlanDropdown();
        
        const currentPlan = apiPlans.find(p => p.id === activeApiPlanId) || apiPlans[0];
        selectedApiPlanId = currentPlan.id; 
        document.getElementById('api-plan-input').value = currentPlan.name;
        syncUIWithApiPlanData(currentPlan.data);
    } catch(e) { console.error("API Plan Load Error", e); }
}

function renderApiPlanDropdown() {
    const menu = document.getElementById('apiPlanDropdownMenu');
    menu.innerHTML = '';
    
    apiPlans.forEach(plan => {
        const div = document.createElement('div');
        div.className = 'url-option';
        div.innerText = plan.name + (plan.id === activeApiPlanId ? ' (已应用)' : '');
        div.onclick = () => { selectApiPlan(plan.id, plan.name); };
        menu.appendChild(div);
    });
}

function toggleApiPlanMenu() { document.getElementById('apiPlanDropdownMenu').classList.toggle('active'); }

function selectApiPlan(id, name) {
    selectedApiPlanId = id;
    const pureName = apiPlans.find(p => p.id === id)?.name || name;
    document.getElementById('api-plan-input').value = pureName;
    document.getElementById('apiPlanDropdownMenu').classList.remove('active');
    
    const plan = apiPlans.find(p => p.id === id);
    if(plan && plan.data) syncUIWithApiPlanData(plan.data);
}

function saveApiPlanPrompt() {
    let currentName = "";
    if (selectedApiPlanId) {
        const plan = apiPlans.find(p => p.id === selectedApiPlanId);
        if (plan) currentName = plan.name;
    }
    openCustomPrompt('保存API方案', 'action_save_api_plan', '请输入方案名称', 'input');
    setTimeout(() => { document.getElementById('promptInput').value = currentName; }, 10);
}

function executeSaveApiPlan(planName) {
    const apiData = getCurrentApiUIData();
    const existingIndex = apiPlans.findIndex(p => p.name === planName);
    
    if (existingIndex > -1) {
        apiPlans[existingIndex].data = apiData; 
        selectedApiPlanId = apiPlans[existingIndex].id;
    } else {
        const newPlan = { id: 'api_plan_' + Date.now(), name: planName, data: apiData };
        apiPlans.push(newPlan);
        selectedApiPlanId = newPlan.id;
    }
    
    saveToDB('qiandao_api_plans', JSON.stringify(apiPlans));
    if (activeApiPlanId === selectedApiPlanId) saveToDB('active_api_plan_id', activeApiPlanId);
    
    renderApiPlanDropdown();
    document.getElementById('api-plan-input').value = planName;
    showToast(`方案 [${planName}] 保存成功`);
}

function applyApiPlan() {
    if(!selectedApiPlanId) { showToast("请先在列表中选择一个方案！"); return; }
    const planIndex = apiPlans.findIndex(p => p.id === selectedApiPlanId);
    if(planIndex > -1) {
        apiPlans[planIndex].data = getCurrentApiUIData();
        saveToDB('qiandao_api_plans', JSON.stringify(apiPlans));
        activeApiPlanId = selectedApiPlanId;
        saveToDB('active_api_plan_id', activeApiPlanId);
        renderApiPlanDropdown(); 
        showToast("应用成功");
    }
}

function deleteApiPlan() {
    if(!selectedApiPlanId) { showToast("请先在列表中选择一个方案！"); return; }
    if (apiPlans.length <= 1) { showToast("至少需要保留一个方案！"); return; }
    openCustomPrompt('删除方案', 'action_delete_api_plan', '确定要彻底删除该方案吗？', 'confirm_delete');
}

// ⭐ 已修复：移除了垃圾桶Emoji
function executeDeleteApiPlan() {
    apiPlans = apiPlans.filter(p => p.id !== selectedApiPlanId);
    saveToDB('qiandao_api_plans', JSON.stringify(apiPlans));
    
    if (activeApiPlanId === selectedApiPlanId) {
        activeApiPlanId = apiPlans[0].id;
        saveToDB('active_api_plan_id', activeApiPlanId);
    }
    
    selectedApiPlanId = apiPlans[0].id;
    const currentPlan = apiPlans[0];
    document.getElementById('api-plan-input').value = currentPlan.name;
    syncUIWithApiPlanData(currentPlan.data);

    renderApiPlanDropdown();
    showToast("方案已删除");
}


// ==========================================
// 🚀 全新软件3：世界书 (真实数据闭环 & U型折扇)
// ==========================================

// --- 核心真实数据源 ---
let activeWorldbooks = []; 
let bindedCharacters = []; 
let customCommonGroups = []; 

// 【新增：持久化加载】
async function loadWorldbooksData() {
    try {
        const dbWb = await db.settings.get('worldbooks_data');
        if (dbWb && dbWb.value) {
            activeWorldbooks = JSON.parse(dbWb.value);
            recalcCategories(); // 恢复内存数据联动
        }
    } catch(e) { console.error("Load WB Data Error", e); }
}

// 自动计算分类白球
function recalcCategories() {
    bindedCharacters = []; customCommonGroups = [];
    activeWorldbooks.forEach(b => {
        if (b.category === '已绑定' && !bindedCharacters.includes(b.subGroup)) bindedCharacters.push(b.subGroup);
        else if (b.category === '通用' && !customCommonGroups.includes(b.subGroup)) customCommonGroups.push(b.subGroup);
    });
}

// 真实应用中这里将从数据库读取角色列表，目前为空
let availableChars = []; 
let lastPlanetClickTime = 0;


function openWorldbookApp(event) {
    const overlay = document.getElementById('worldbookAppOverlay');
    if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        overlay.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;
    } else {
        overlay.style.transformOrigin = 'center center';
    }
    
    // --- 【新增】强制重置为默认的“全部”状态 ---
    isWbDeleteMode = false; // 每次打开强制退出删除模式
    document.getElementById('wb-popover-menu').classList.remove('active'); // 关掉可能遗留的气泡菜单
    
    // 强制把三个星球的位置归位
    const track = document.getElementById('wb-planet-track');
    if(track) {
        const planets = track.querySelectorAll('.wb-planet');
        planets.forEach(p => {
            p.classList.remove('left', 'center', 'right');
            if (p.innerText === '已绑定') p.classList.add('left');
            else if (p.innerText === '全部') p.classList.add('center');
            else if (p.innerText === '通用') p.classList.add('right');
        });
    }

    // 强制渲染“全部”视图的内容（如果没有，自然会显示暂无）
    document.getElementById('wb-current-view').innerText = '全部';
    renderWorldbookList('全部');
    
    overlay.classList.add('active');
}

function closeWorldbookApp() {
    document.getElementById('worldbookAppOverlay').classList.remove('active');
    closeCharSelector(); 
    document.getElementById('wb-popover-menu').classList.remove('active');
}

function handlePlanetClick(clickedEl) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastPlanetClickTime;
    lastPlanetClickTime = currentTime;
    document.getElementById('wb-popover-menu').classList.remove('active'); 
    
    if (clickedEl.classList.contains('center')) {
        if (timeDiff < 350 && (clickedEl.innerText === '已绑定' || clickedEl.innerText === '通用')) {
            openCharSelector(clickedEl.innerText);
        }
        return; 
    }
    closeCharSelector(); 
    const track = document.getElementById('wb-planet-track');
    const currentCenter = track.querySelector('.center');
    let clickedPos = clickedEl.classList.contains('left') ? 'left' : 'right';

    clickedEl.classList.remove(clickedPos);
    clickedEl.classList.add('center');
    currentCenter.classList.remove('center');
    currentCenter.classList.add(clickedPos);
    
    document.getElementById('wb-current-view').innerText = clickedEl.innerText;
    renderWorldbookList(clickedEl.innerText);
}

function openCharSelector(type) {
    document.getElementById('wb-blur-overlay').classList.add('active');
    document.getElementById('wb-main-container').classList.add('selector-mode');
    document.getElementById('wb-char-selector-area').classList.add('active');
    renderCharBalls(type); 
}

function closeCharSelector() {
    document.getElementById('wb-blur-overlay').classList.remove('active');
    document.getElementById('wb-main-container').classList.remove('selector-mode');
    document.getElementById('wb-char-selector-area').classList.remove('active');
}

// 废弃U型曲线，改为纯网格渲染
function renderCharBalls(type) {
    const track = document.getElementById('char-scroll-track');
    track.innerHTML = ''; 
    const dataSource = type === '已绑定' ? bindedCharacters : customCommonGroups;

    if (dataSource.length === 0) {
        track.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding-top:40px; color:#aaa; font-size:12px; font-weight:bold; letter-spacing:1px;">- 暂无分类数据 -</div>`;
        return;
    }

    dataSource.forEach(name => {
        const item = document.createElement('div');
        item.className = 'wb-char-item';
        item.innerHTML = `
            <div class="char-ball" onclick="selectChar('${name}', '${type}')"></div>
            <div class="char-label">${name}</div>
        `;
        track.appendChild(item);
    });
}

function selectChar(itemName, type) {
    closeCharSelector();
    const suffix = type === '已绑定' ? '的专属' : '分类';
    const finalView = `${itemName} ${suffix}`;
    document.getElementById('wb-current-view').innerText = finalView;
    isWbDeleteMode = false; // 切换分类时退出删除模式
    renderWorldbookList(finalView); 
}

function toggleAddMenu(event) {
    event.stopPropagation();
    document.getElementById('wb-popover-menu').classList.toggle('active');
}
document.addEventListener('click', function(e) {
    const menu = document.getElementById('wb-popover-menu');
    const btn = document.getElementById('wb-add-btn');
    if (menu && menu.classList.contains('active') && e.target !== btn && !menu.contains(e.target)) {
        menu.classList.remove('active');
    }
});

// --- 🚀 全新导入与删除模式控制 ---
let isWbDeleteMode = false;

function toggleWbDeleteMode() {
    isWbDeleteMode = !isWbDeleteMode;
    document.getElementById('wb-popover-menu').classList.remove('active');
    const currentViewText = document.getElementById('wb-current-view').innerText;
    renderWorldbookList(currentViewText);
}

function importWorldbook() {
    document.getElementById('wb-popover-menu').classList.remove('active');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const obj = JSON.parse(event.target.result);
                obj.id = 'wb_' + Date.now(); 
                activeWorldbooks.push(obj);
                saveToDB('worldbooks_data', JSON.stringify(activeWorldbooks));
                recalcCategories();
                const currentViewText = document.getElementById('wb-current-view').innerText;
                renderWorldbookList(currentViewText);
                showToast('导入成功');
            } catch(err) { showToast('文件格式有误'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportWorldbook(id) {
    const book = activeWorldbooks.find(b => b.id === id);
    if(!book) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(book, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${book.title}.json`);
    dlAnchorElem.click();
}

// --- 🚀 底部弹窗：表单与角色选择逻辑 ---
let tempEntries = [];
let currentSelectedSubGroup = ''; 
let currentSelectedCategory = '全部';
let editingBookId = null; 

function openWorldbookSheet() {
    editingBookId = null; 
    document.getElementById('wb-popover-menu').classList.remove('active'); 
    document.getElementById('wb-sheet-overlay').classList.add('active');
    document.getElementById('wb-bottom-sheet').classList.add('active');
    
    document.getElementById('sheet-input-name').value = '';
    currentSelectedSubGroup = '';
    toggleSheetGroup('全部'); 
    
    // 【改成纯中文】
    tempEntries = [{ id: Date.now(), name: '', trigger: '始终触发', keyword: '', content: '' }];
    renderSheetEntries();

    const actionRow = document.querySelector('.sheet-action-row');
    if(actionRow) actionRow.innerHTML = `
        <div class="sheet-btn cancel" onclick="closeWorldbookSheet()">取消</div>
        <div class="sheet-btn confirm" onclick="saveWorldbook()">保存世界书</div>
    `;
}

function closeWorldbookSheet() {
    document.getElementById('wb-sheet-overlay').classList.remove('active');
    document.getElementById('wb-bottom-sheet').classList.remove('active');
}

function toggleSheetGroup(groupName) {
    currentSelectedCategory = groupName;
    const caps = document.querySelectorAll('#sheet-group-toggles .sheet-capsule');
    caps.forEach(c => c.classList.remove('active'));
    const targetCap = Array.from(caps).find(c => c.innerText === groupName);
    if(targetCap) targetCap.classList.add('active');

    const groupBtns = document.getElementById('sheet-common-group-btns');
    const groupDisp = document.getElementById('sheet-current-group-display');
    const charBtn = document.getElementById('sheet-char-add-btn');

    if (groupName === '已绑定') {
        groupBtns.style.display = 'none'; groupDisp.style.display = 'none';
        charBtn.style.display = 'block';
        updateCharBtnUI();
    } else if (groupName === '通用') {
        charBtn.style.display = 'none';
        groupBtns.style.display = 'flex'; groupDisp.style.display = 'block';
        updateCommonGroupUI();
    } else {
        charBtn.style.display = 'none';
        groupBtns.style.display = 'none'; groupDisp.style.display = 'none';
    }
}

// -- 角色选择 --
function openCharSelectModal() {
    const list = document.getElementById('charSelectList');
    list.innerHTML = '';
    document.querySelector('#charSelectOverlay .custom-prompt-title').innerText = '选择要绑定的角色';

    // 🌟 核心串联：从通讯录实时拉取已创建的角色名字列表，去重去空
    // 🌟 修复Bug：去掉了严苛的 `n !== '未命名角色'` 拦截，允许新手即时不改名字也能顺利绑定角色
    const availableChars = [...new Set(contactsList.map(c => c.name))].filter(n => n);

    // 如果没有角色，展示暂无角色提示
    if (availableChars.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 20px 10px; color:#999; font-size:13px; font-weight:500;">暂无已创建的角色，请先去通讯录新建单人</div>`;
    } else {
        // 动态渲染真实的聊天角色列表
        availableChars.forEach(char => {
            const item = document.createElement('div');
            item.className = 'model-item-btn'; item.innerText = char;
            item.onclick = () => { currentSelectedSubGroup = char; updateCharBtnUI(); closeCharSelectModal(); };
            list.appendChild(item);
        });
    }

    document.getElementById('charSelectOverlay').classList.add('active');
}

function closeCharSelectModal() { document.getElementById('charSelectOverlay').classList.remove('active'); }

function updateCharBtnUI() {
    const btn = document.getElementById('sheet-char-add-btn');
    if(currentSelectedCategory === '已绑定' && currentSelectedSubGroup) {
        btn.innerText = `已选择绑定: ${currentSelectedSubGroup}`; btn.classList.add('has-char');
    } else {
        btn.innerText = '+ 选择要绑定的角色'; btn.classList.remove('has-char');
    }
}

// -- 通用分组交互 --
function openNewGroupPrompt() {
    openCustomPrompt('新建通用分组', 'action_new_common_group', '输入分组名称', 'input');
}
function openManageGroupModal() {
    const list = document.getElementById('charSelectList');
    list.innerHTML = '';
    if(customCommonGroups.length === 0) list.innerHTML = `<div style="text-align:center; padding: 10px; color:#999; font-size:12px;">暂无分组</div>`;
    
    customCommonGroups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'model-item-btn';
        item.style.display = 'flex'; item.style.justifyContent = 'space-between'; item.style.alignItems = 'center';
        item.innerHTML = `
            <span onclick="selectCommonGroup('${group}')" style="flex:1;">${group}</span>
            <span onclick="deleteCommonGroup('${group}', event)" style="color:#ff3b30; font-size:12px; font-weight:bold; padding: 5px;">删除</span>
        `;
        list.appendChild(item);
    });
    
    document.querySelector('#charSelectOverlay .custom-prompt-title').innerText = '管理通用分组';
    document.getElementById('charSelectOverlay').classList.add('active');
}
function selectCommonGroup(groupName) { currentSelectedSubGroup = groupName; updateCommonGroupUI(); closeCharSelectModal(); }
function deleteCommonGroup(groupName, e) {
    e.stopPropagation();
    if(confirm(`确定删除分组[${groupName}]吗？相关的世界书也会失去该分组标签`)) {
        customCommonGroups = customCommonGroups.filter(g => g !== groupName);
        if(currentSelectedSubGroup === groupName) { currentSelectedSubGroup = ''; updateCommonGroupUI(); }
        openManageGroupModal(); 
    }
}
function updateCommonGroupUI() {
    const span = document.getElementById('current-group-name');
    if(span) span.innerText = currentSelectedSubGroup ? currentSelectedSubGroup : '未选择';
}


// -- 渲染多条目 --
function renderSheetEntries() {
    const container = document.getElementById('sheet-entries-container');
    container.innerHTML = '';
    tempEntries.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'entry-card';
        div.innerHTML = `
            <div class="entry-card-header">
                <span class="entry-card-title">设定条目 ${index + 1}</span>
                ${tempEntries.length > 1 ? `<span class="entry-delete-btn" onclick="removeSheetEntry(${index})">删除</span>` : ''}
            </div>
            <input type="text" class="sheet-input" placeholder="设定名称 (如: 外貌/世界观)" value="${entry.name}" onblur="tempEntries[${index}].name = this.value">
            <div class="sheet-capsule-group">
                <div class="sheet-capsule ${entry.trigger === '始终触发' ? 'active' : ''}" onclick="toggleEntryTrigger(${index}, '始终触发')">始终触发</div>
                <div class="sheet-capsule ${entry.trigger === '关键词触发' ? 'active' : ''}" onclick="toggleEntryTrigger(${index}, '关键词触发')">关键词触发</div>
            </div>
            <input type="text" class="sheet-input sub-input" placeholder="触发关键词，逗号隔开..." style="display: ${entry.trigger === '关键词触发' ? 'block' : 'none'};" value="${entry.keyword}" onblur="tempEntries[${index}].keyword = this.value">
            <textarea class="sheet-textarea" placeholder="输入设定内容..." onblur="tempEntries[${index}].content = this.value">${entry.content}</textarea>
        `;
        container.appendChild(div);
    });
}
function addSheetEntry() { tempEntries.push({ id: Date.now(), name: '', trigger: '始终触发', keyword: '', content: '' }); renderSheetEntries(); }
function removeSheetEntry(index) { if(tempEntries.length <= 1) return; tempEntries.splice(index, 1); renderSheetEntries(); }
function toggleEntryTrigger(index, type) { tempEntries[index].trigger = type; renderSheetEntries(); }

// --- 🌟 管理功能：编辑与删除 ---
function editWorldbook(bookId) {
    const book = activeWorldbooks.find(b => b.id === bookId);
    if (!book) return;
    
    editingBookId = bookId;
    document.getElementById('wb-popover-menu').classList.remove('active'); 
    document.getElementById('wb-sheet-overlay').classList.add('active');
    document.getElementById('wb-bottom-sheet').classList.add('active');
    
    document.getElementById('sheet-input-name').value = book.title;
    currentSelectedSubGroup = book.subGroup;
    toggleSheetGroup(book.category);
    
    tempEntries = JSON.parse(JSON.stringify(book.entries));
    renderSheetEntries();
    
    const actionRow = document.querySelector('.sheet-action-row');
    if(actionRow) actionRow.innerHTML = `
        <div class="sheet-btn cancel" onclick="closeWorldbookSheet()">取消</div>
        <div class="sheet-btn confirm" onclick="saveWorldbook()">保存修改</div>
    `;
}

let bookIdToDelete = null; // 临时记录要删除的书本ID

function deleteWorldbook(bookId) {
    bookIdToDelete = bookId;
    // 呼出系统自带的极简白底确认弹窗
    openCustomPrompt('删除世界书', 'action_delete_worldbook', '确定要删除当前世界书吗？删除后将无法恢复。', 'confirm_delete');
}

// 弹窗点击“确定”后实际执行的删除逻辑
function executeDeleteWorldbook() {
    if (!bookIdToDelete) return;
    activeWorldbooks = activeWorldbooks.filter(b => b.id !== bookIdToDelete);
    saveToDB('worldbooks_data', JSON.stringify(activeWorldbooks));
    recalcCategories(); 
    showToast('世界书已成功删除');
    const currentViewText = document.getElementById('wb-current-view').innerText;
    renderWorldbookList(currentViewText);
    bookIdToDelete = null;
}

function saveWorldbook() {
    const bookName = document.getElementById('sheet-input-name').value.trim() || '未命名世界书';
    
    let subGroup = '';
    if (currentSelectedCategory === '已绑定') {
        if(!currentSelectedSubGroup) { showToast('请选择绑定的通讯录角色'); return; }
        subGroup = currentSelectedSubGroup;
    } else if (currentSelectedCategory === '通用') {
        if(!currentSelectedSubGroup) { showToast('请新建或选择一个分组'); return; }
        subGroup = currentSelectedSubGroup;
    }

    if (editingBookId) {
        const idx = activeWorldbooks.findIndex(b => b.id === editingBookId);
        if (idx > -1) {
            activeWorldbooks[idx].title = bookName;
            activeWorldbooks[idx].category = currentSelectedCategory;
            activeWorldbooks[idx].subGroup = subGroup;
            activeWorldbooks[idx].entries = JSON.parse(JSON.stringify(tempEntries));
        }
        showToast("世界书已更新！");
    } else {
        const newBook = {
            id: 'wb_' + Date.now(), title: bookName, category: currentSelectedCategory,
            subGroup: subGroup, entries: JSON.parse(JSON.stringify(tempEntries))
        };
        activeWorldbooks.push(newBook);
        showToast("世界书已保存！");
    }

    saveToDB('worldbooks_data', JSON.stringify(activeWorldbooks));
    recalcCategories();
    closeWorldbookSheet();
    
    const currentViewText = document.getElementById('wb-current-view').innerText;
    renderWorldbookList(currentViewText);
}

// 动态渲染列表 (支持导出/删除模式切换)
function renderWorldbookList(viewText) {
    const container = document.getElementById('wb-list-container');
    container.innerHTML = '';
    let filteredBooks = activeWorldbooks;
    
    if (viewText && viewText !== '全部') {
        if (viewText === '已绑定') filteredBooks = activeWorldbooks.filter(b => b.category === '已绑定');
        else if (viewText === '通用') filteredBooks = activeWorldbooks.filter(b => b.category === '通用');
        else {
            const realName = viewText.split(' ')[0]; 
            filteredBooks = activeWorldbooks.filter(b => b.subGroup === realName);
        }
    }

    if(filteredBooks.length === 0) {
        container.innerHTML = `<div class="wb-empty-state">当前暂无符合条件的世界书</div>`;
        return;
    }

    filteredBooks.forEach(book => {
        const card = document.createElement('div');
        card.className = 'wb-card';
        card.onclick = () => { if(!isWbDeleteMode) editWorldbook(book.id); };
        
        const entryCount = book.entries.length;
        const triggerType = entryCount > 0 ? book.entries[0].trigger : '始终触发';
        
        const svgIcon = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H12m0 0h5.5A2.5 2.5 0 0 1 20 4.5v15a2.5 2.5 0 0 0-2.5-2.5H12m0 0H6.5A2.5 2.5 0 0 0 4 19.5z"></path></svg>`;
        
        // 删除模式渲染红底垃圾桶，正常模式渲染管理+导出
        let actionHtml = '';
        if (isWbDeleteMode) {
            const trashSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
            actionHtml = `<div class="wb-delete-icon-btn" onclick="event.stopPropagation(); deleteWorldbook('${book.id}')">${trashSvg}</div>`;
        } else {
            actionHtml = `
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div class="wb-btn-mini" onclick="event.stopPropagation(); editWorldbook('${book.id}')">管理</div>
                <div class="wb-btn-mini" style="background:transparent; border:1px solid #ccc; color:#777;" onclick="event.stopPropagation(); exportWorldbook('${book.id}')">导出</div>
            </div>`;
        }
        
        card.innerHTML = `
            <div class="wb-card-icon">${svgIcon}</div>
            <div class="wb-card-info">
                <div class="wb-card-title">${book.title}</div>
                <div class="wb-card-desc">包含 ${entryCount} 条设定 · ${triggerType}</div>
            </div>
            <div class="wb-card-action">${actionHtml}</div>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// 个人资料卡功能 (自定义白灰弹窗)
// ==========================================

// 🌟 唯一关键词：【全局小白弹窗重构】
let currentPromptAction = '';
let currentTargetId = '';
let currentDefaultStr = '';

function openCustomPrompt(title, targetIdOrAction, defaultStr, type = 'input') {
    currentTargetId = targetIdOrAction;
    currentDefaultStr = defaultStr;
    currentPromptAction = type;
    
    document.getElementById('promptTitle').innerText = title;
    
    const inputEl = document.getElementById('promptInput');
    const msgEl = document.getElementById('promptMsg');
    const confirmBtn = document.getElementById('promptConfirmBtn');
    
    confirmBtn.className = 'prompt-btn confirm'; 

    if (type === 'input') {
        inputEl.style.display = 'block';
        msgEl.style.display = 'none';
        
        let currentVal = '';
        if(document.getElementById(targetIdOrAction)) {
             currentVal = document.getElementById(targetIdOrAction).innerText;
        }
        
        // 🔥 绝杀核心：发现任何关于“个性签名”的旧词，立刻清空！绝不让它留在输入框里
        if (currentVal.includes('个性签名') || currentVal.includes('点击设置') || currentVal === '编辑角色对你的专属备注') {
            currentVal = '';
        }

        inputEl.value = currentVal;
        // 动态改变输入框底部的浅灰提示词！这就能解决“下面那个提示词还是老样子”的问题
        inputEl.placeholder = defaultStr; 
    } else if (type === 'confirm_delete' || type === 'confirm_action') {
        inputEl.style.display = 'none';
        msgEl.style.display = 'block';
        msgEl.innerText = defaultStr;
        if(type === 'confirm_delete') confirmBtn.classList.add('danger'); 
    } else {
        inputEl.style.display = 'block';
        msgEl.style.display = 'none';
        inputEl.value = '';
    }
    
    document.getElementById('customPromptOverlay').classList.add('active');
    if (type !== 'confirm_delete' && type !== 'confirm_action') inputEl.focus();
}

function closeCustomPrompt() {
    document.getElementById('customPromptOverlay').classList.remove('active');
    currentTargetId = '';
}

function confirmCustomPrompt() {
    const inputVal = document.getElementById('promptInput').value.trim();
    
    if (currentPromptAction === 'confirm_delete') {
        if (currentTargetId === 'action_delete_plan') executeDeletePlan();
        else if (currentTargetId === 'action_delete_api_plan') executeDeleteApiPlan();
        else if (currentTargetId === 'action_delete_worldbook') executeDeleteWorldbook(); // 【新增】接管世界书的删除确认
    } else if (currentPromptAction === 'confirm_action') {
        if (currentTargetId === 'action_apply_plan') executeApplyPlan();
    } else if (currentTargetId === 'global-avatar-url') {
        if(inputVal !== "") updateCurrentAvatar(inputVal);
    } else if (currentTargetId === 'cs-avatar-url') {
        if(inputVal !== "") document.getElementById('cs-avatar').src = inputVal;
        // 🌟 接收聊天室内网络图片链接修改头像
        if(inputVal !== "") {
            document.getElementById('img-chat-init-avatar').src = inputVal;
            if (currentChatContactId) {
                const contact = contactsList.find(c => c.id === currentChatContactId);
                if (contact) {
                    contact.avatar = inputVal; // 全局同步数据
                    saveToDB('contacts_data', JSON.stringify(contactsList));
                    renderMsgList();
                }
            }
        }
    } else if (currentTargetId === 'action_save_plan_name') {
        if(inputVal !== "") executeSavePlan(inputVal);
    }
else if (currentTargetId === 'action_new_common_group') {
        if(inputVal !== "") {
            if(!customCommonGroups.includes(inputVal)) customCommonGroups.push(inputVal);
            currentSelectedSubGroup = inputVal;
            updateCommonGroupUI();
        }
    } else if (currentTargetId === 'action_new_nc_group') {
        // 【本次新增】接收新建角色分组的回调
        if(inputVal !== "") {
            if(!ncCustomGroups.includes(inputVal)) ncCustomGroups.push(inputVal);
            selectNcGroup(inputVal); // 直接帮他选中新建的分组
        }
    } else {

        const finalVal = inputVal === "" ? currentDefaultStr : inputVal;
        const el = document.getElementById(currentTargetId);
        if(el) {
            el.innerText = finalVal;
            currentTempPlan[currentTargetId] = finalVal;
            autoSaveTempPlan(); 
        }
    }
    closeCustomPrompt();
}

function focusInlineInput(inputId) {
    const input = document.getElementById(inputId);
    if(input && input.type !== 'date') input.focus();
}

function saveInlineInput(targetId, val) {
    const finalVal = val.trim(); // 核心修改：不再强行把提示词变作真字，允许输入框完全为空

    const hiddenEl = document.getElementById(targetId);
    if(hiddenEl) hiddenEl.innerText = finalVal;

    const inputEl = document.getElementById(targetId.replace('text-', 'input-'));
    if(inputEl) inputEl.value = finalVal; // 当值为空时，HTML原生的浅灰提示词就会自然显现！

    currentTempPlan[targetId] = finalVal;
    autoSaveTempPlan();
}

function handleEnterSave(event, inputEl) { if (event.key === 'Enter') inputEl.blur(); }

function handleBirthdayChange(dateString) {
    if(!dateString) return;
    saveInlineInput('text-detail-birthday', dateString);
    
    const displayInput = document.getElementById('display-detail-birthday');
    if(displayInput) displayInput.value = dateString;

    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const zodiac = getZodiacSign(day, month);
    
    const zodiacInput = document.getElementById('input-detail-zodiac');
    if(zodiacInput) {
        zodiacInput.value = zodiac;
        saveInlineInput('text-detail-zodiac', zodiac);
    }
}

function getZodiacSign(day, month) {
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "水瓶座";
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "双鱼座";
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "白羊座";
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "金牛座";
    if ((month == 5 && day >= 21) || (month == 6 && day <= 21)) return "双子座";
    if ((month == 6 && day >= 22) || (month == 7 && day <= 22)) return "巨蟹座";
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "狮子座";
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "处女座";
    if ((month == 9 && day >= 23) || (month == 10 && day <= 23)) return "天秤座";
    if ((month == 10 && day >= 24) || (month == 11 && day <= 22)) return "天蝎座";
    if ((month == 11 && day >= 23) || (month == 12 && day <= 21)) return "射手座";
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "摩羯座";
    return "-";
}

function toggleSecretFile() {
    const sw = document.getElementById('secretToggleSwitch');
    const card = document.getElementById('secretFileCard');
    const isSecretMode = sw.classList.contains('active');
    
    if(isSecretMode) {
        sw.classList.remove('active');
        card.classList.remove('open');
        card.classList.add('closed');
        currentTempPlan['secret_mode'] = false;
    } else {
        sw.classList.add('active');
        card.classList.remove('closed');
        card.classList.add('open');
        currentTempPlan['secret_mode'] = true;
    }
    autoSaveTempPlan();
}

function toggleAvatarMenu() { document.getElementById('avatarActionMenu').classList.toggle('active'); }

document.addEventListener('click', function(e) {
    const menu = document.getElementById('avatarActionMenu');
    const avatarImg = document.getElementById('img-profile-avatar');
    if (menu && menu.classList.contains('active') && e.target !== menu && e.target !== avatarImg) menu.classList.remove('active');
    
    const planMenu = document.getElementById('planActionMenu');
    const planCapsule = document.querySelector('.plan-capsule');
    if (planMenu && planMenu.classList.contains('active') && planCapsule && !planCapsule.contains(e.target) && !planMenu.contains(e.target)) planMenu.classList.remove('active');

    const dataModal = document.getElementById('profileDataModal');
    if (dataModal && dataModal.classList.contains('active') && !dataModal.contains(e.target) && !e.target.closest('.plan-action-btn')) closeProfileDataModal();
    
    const urlInput = document.getElementById('api-base-url-input');
    const urlMenu = document.getElementById('urlDropdownMenu');
    if (urlMenu && urlMenu.classList.contains('active') && e.target !== urlInput && !urlMenu.contains(e.target)) urlMenu.classList.remove('active');

    const apiPlanInput = document.getElementById('api-plan-input');
    const apiPlanMenu = document.getElementById('apiPlanDropdownMenu');
    if (apiPlanMenu && apiPlanMenu.classList.contains('active') && e.target !== apiPlanInput && !apiPlanMenu.contains(e.target)) apiPlanMenu.classList.remove('active');
});

async function updateCurrentAvatar(base64orUrl) {
    const el = document.getElementById('img-profile-avatar');
    if(el) el.src = base64orUrl;
    currentTempPlan['avatar'] = base64orUrl;
    autoSaveTempPlan();
}

function changeAvatarLink() {
    toggleAvatarMenu(); openCustomPrompt('输入图片链接', 'global-avatar-url', '', 'input');
}

function triggerLocalAvatar() {
    document.getElementById('localAvatarInput').click(); toggleAvatarMenu();
}

function uploadLocalAvatar(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { updateCurrentAvatar(e.target.result); };
    reader.readAsDataURL(file);
}

let profilePlans = [];
let currentActivePlanId = 'default';

// 1. 纯净版保存：绝不强塞占位符文字，空的就是空的！
function saveInlineInput(targetId, val) {
    const finalVal = val.trim(); // 直接保存空字符串
    
    const hiddenEl = document.getElementById(targetId);
    if(hiddenEl) hiddenEl.innerText = finalVal;

    const inputEl = document.getElementById(targetId.replace('text-', 'input-'));
    if(inputEl && inputEl.value !== finalVal) inputEl.value = finalVal;

    currentTempPlan[targetId] = finalVal;
    autoSaveTempPlan();
}

// 2. 默认数据全部设为空字符串，让 HTML 原生的浅灰 placeholder 生效
// 🌟 唯一关键词：【清理本地顽固死数据】
const baseDefaults = {
    avatar: 'https://i.pinimg.com/564x/bd/d9/39/bdd9392233f07a78c005b63001859942.jpg', 'text-profile-name': '某某', 'text-profile-sign': '编辑角色对你的专属备注',
    'text-detail-gender': '', 'text-detail-age': '', 'text-detail-birthday': '', 'text-detail-zodiac': '', 'text-detail-location': '',
    'text-tag-1': '', 'text-tag-2': '', 'text-tag-3': '', 'secret_mode': false, 'text-secret-file': ''
};

function syncViewFromTempPlan() {
    // 🔪 暴力粉碎旧签名缓存：只要包含这些词根，强行判定为垃圾数据并清空
    let badSign = currentTempPlan['text-profile-sign'] || '';
    if (badSign.includes('个性签名') || badSign.includes('点击') || badSign.includes('设置') || badSign.includes('专属备注...')) {
        currentTempPlan['text-profile-sign'] = ''; // 强行清空，让下方渲染时自动调用 default 的最新值
    }

    const clearWords = ['-', 'Unknown Location', '标签']; 
    
    const els = ['text-profile-name', 'text-profile-sign', 'text-detail-gender', 'text-detail-age', 'text-detail-birthday', 'text-detail-zodiac', 'text-detail-location', 'text-tag-1', 'text-tag-2', 'text-tag-3', 'text-secret-file'];
    els.forEach(id => { 
        if (clearWords.includes(currentTempPlan[id])) currentTempPlan[id] = '';
        const dom = document.getElementById(id); 
        // 这里会自动兜底：如果被清空了，就会显示 baseDefaults 里设定的"编辑角色对你的专属备注"
        if(dom) dom.innerText = currentTempPlan[id] || (baseDefaults[id] || ''); 
    });

    const inputEls = ['input-detail-gender', 'input-detail-age', 'input-detail-zodiac', 'input-detail-location', 'input-tag-1', 'input-tag-2', 'input-tag-3'];
    inputEls.forEach(id => { 
        const dbId = id.replace('input-', 'text-'); 
        const dom = document.getElementById(id); 
        if(dom) dom.value = currentTempPlan[dbId] || ''; 
    });

    const bdayVal = currentTempPlan['text-detail-birthday'] || '';
    const realBday = document.getElementById('input-detail-birthday'); const dispBday = document.getElementById('display-detail-birthday');
    if(realBday) realBday.value = bdayVal; if(dispBday) dispBday.value = bdayVal;

    const secretTextarea = document.getElementById('input-secret-file');
    if(secretTextarea) secretTextarea.value = currentTempPlan['text-secret-file'] || '';

    const sw = document.getElementById('secretToggleSwitch'); const card = document.getElementById('secretFileCard');
    if(currentTempPlan['secret_mode']) { sw.classList.add('active'); card.classList.remove('closed'); card.classList.add('open'); } 
    else { sw.classList.remove('active'); card.classList.add('closed'); card.classList.remove('open'); }

    const ava = currentTempPlan['avatar'] || baseDefaults['avatar'];
    const pAva = document.getElementById('img-profile-avatar');
    if(pAva) pAva.src = ava;
}

function applyPlan(planId) {
    const plan = profilePlans.find(p => p.id === planId);
    if (!plan) return;
    currentActivePlanId = plan.id;
    document.getElementById('current-plan-name').innerText = plan.name;
    currentTempPlan = { ...baseDefaults, ...plan.data };
    syncViewFromTempPlan(); saveToDB('active_plan_id', planId); autoSaveTempPlan();
}

function createNewPlan() {
    togglePlanMenu(); currentActivePlanId = 'temp_new'; document.getElementById('current-plan-name').innerText = "未命名方案";
    currentTempPlan = { ...baseDefaults }; syncViewFromTempPlan(); autoSaveTempPlan();
}

function saveCurrentPlan() {
    togglePlanMenu(); let currentName = "";
    if (currentActivePlanId !== 'temp_new') { const cp = profilePlans.find(p => p.id === currentActivePlanId); if (cp) currentName = cp.name; }
    openCustomPrompt('保存方案', 'action_save_plan_name', '请输入方案名称', 'input');
    setTimeout(() => { document.getElementById('promptInput').value = currentName; }, 10);
}

function executeSavePlan(planName) {
    if (currentActivePlanId !== 'temp_new') {
        const planIndex = profilePlans.findIndex(p => p.id === currentActivePlanId);
        if (planIndex > -1) { profilePlans[planIndex].name = planName; profilePlans[planIndex].data = { ...currentTempPlan }; } 
        else { currentActivePlanId = "plan_" + Date.now(); profilePlans.push({ id: currentActivePlanId, name: planName, data: { ...currentTempPlan } }); }
    } else { currentActivePlanId = "plan_" + Date.now(); profilePlans.push({ id: currentActivePlanId, name: planName, data: { ...currentTempPlan } }); }
    
    document.getElementById('current-plan-name').innerText = planName;
    saveToDB('profile_plans', JSON.stringify(profilePlans)); saveToDB('active_plan_id', currentActivePlanId);
}

function promptApplyPlan() { togglePlanMenu(); openCustomPrompt('提示', 'action_apply_plan', '确定要应用这套个人资料吗？', 'confirm_action'); }

function executeApplyPlan() {
    const avatarUrl = currentTempPlan['avatar'] || baseDefaults['avatar'];
    const nickName = currentTempPlan['text-profile-name'] || baseDefaults['text-profile-name'];
    const sAva = document.getElementById('img-sidebar-avatar'); if(sAva) sAva.src = avatarUrl;
    const sName = document.getElementById('text-sidebar-name'); if(sName) sName.innerText = nickName;
    saveToDB('global_applied_profile', JSON.stringify({ avatar: avatarUrl, name: nickName }));
}

function deleteCurrentPlan() {
    togglePlanMenu();
    if (currentActivePlanId === 'temp_new') { applyPlan('default'); return; }
    if (currentActivePlanId === 'default') { showToast("系统默认配置无法删除！"); return; }
    openCustomPrompt('提示', 'action_delete_plan', '确定要删除当前的个人介绍方案吗？', 'confirm_delete');
}

function executeDeletePlan() { profilePlans = profilePlans.filter(p => p.id !== currentActivePlanId); saveToDB('profile_plans', JSON.stringify(profilePlans)); applyPlan('default'); }
function autoSaveTempPlan() { saveToDB('temp_profile_plan', JSON.stringify(currentTempPlan)); }

function togglePlanMenu() {
    const menu = document.getElementById('planActionMenu');
    if (menu) menu.classList.toggle('active');
}


function openProfileDataModal() {
    togglePlanMenu(); 
    const modal = document.getElementById('profileDataModal');
    const container = document.querySelector('.screen-body-profile');
    const listWrapper = document.getElementById('profilePlansList');
    listWrapper.innerHTML = '';
    
    profilePlans.forEach(plan => {
        const div = document.createElement('div');
        div.className = 'plan-list-item';
        if (plan.id === currentActivePlanId) div.classList.add('active');
        div.innerText = plan.name;
        div.onclick = () => { applyPlan(plan.id); closeProfileDataModal(); };
        listWrapper.appendChild(div);
    });

    container.classList.add('blurred'); modal.classList.add('active');
}

function closeProfileDataModal() {
    document.getElementById('profileDataModal').classList.remove('active');
    document.querySelector('.screen-body-profile').classList.remove('blurred');
}

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
            currentTempPlan = { ...baseDefaults, ...JSON.parse(dbTemp.value) }; syncViewFromTempPlan();
            const p = profilePlans.find(p => p.id === currentActivePlanId);
            if(p) document.getElementById('current-plan-name').innerText = p.name; else document.getElementById('current-plan-name').innerText = "未命名方案";
        } else { applyPlan(currentActivePlanId); }
    } catch(e) { console.error("Plan Load Error", e); }
}

function updateSystemTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;
    const pastTime = new Date(now.getTime() - 60000); 
    const pastHours = String(pastTime.getHours()).padStart(2, '0'); const pastMinutes = String(pastTime.getMinutes()).padStart(2, '0');
    const pastTimeStr = `${pastHours}:${pastMinutes}`;
    
    if (document.getElementById('chat-time-1')) document.getElementById('chat-time-1').innerText = pastTimeStr;
    if (document.getElementById('chat-time-2')) document.getElementById('chat-time-2').innerText = currentTimeStr;
}

updateSystemTime(); setInterval(updateSystemTime, 1000);

const db = new Dexie("QianDaoPhoneDB");
db.version(2).stores({ settings: '&key, value', assets: '&key, data' });

async function requestPersistence() { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); }
requestPersistence();

async function saveToDB(key, val) { try { await db.settings.put({ key: key, value: val }); } catch(e) {} }

async function loadBaseData() {
    try {
        await loadPlans(); 
        await loadApiPlansData();
        await loadWorldbooksData(); // 【加入世界书的开机读取联动】
        await loadContactsData(); // 🌟 插入这里：加入开机读取联动，防止刷新白屏

        const dbGlobal = await db.settings.get('global_applied_profile');
        if (dbGlobal && dbGlobal.value) {
            const appliedData = JSON.parse(dbGlobal.value);
            const sAva = document.getElementById('img-sidebar-avatar'); if(sAva) sAva.src = appliedData.avatar;
            const sName = document.getElementById('text-sidebar-name'); if(sName) sName.innerText = appliedData.name;
        }
        
        const settings = await db.settings.toArray();
        settings.forEach(item => {
            if(item.key.startsWith('color_')) { 
                // 【绝杀Bug区】：已修复此处因变量未定义引起的强制中断卡死崩溃报错
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
            if(item.key === 'bg_image_data') { document.body.style.backgroundImage = `url(${item.data})`; document.body.style.backgroundSize = "cover"; } 
            else if (item.key === 'global_avatar') { ['img-main-avatar', 'img-chat-avatar', 'img-blog-avatar'].forEach(id => { const el = document.getElementById(id); if(el) el.src = item.data; }); } 
            else { const el = document.getElementById(item.key); if(el && el.id !== 'img-profile-avatar' && el.id !== 'img-sidebar-avatar') el.src = item.data; }
        });
    } catch (e) { console.error("Load Base Error", e); }
}

window.addEventListener('load', loadBaseData);

function hardReset() { if(confirm('警告：這將會刪除所有本地数据！')) { db.delete().then(() => { location.reload(); }); } }


// --- 消息页面右上角 + 号菜单功能 ---
function toggleMsgAddMenu(event) {
    event.stopPropagation();
    document.getElementById('msg-popover-menu').classList.toggle('active');
}

// 监听全局点击事件，实现点击外部自动关闭弹窗
document.addEventListener('click', function(e) {
    const msgMenu = document.getElementById('msg-popover-menu');
    const msgBtn = document.querySelector('.msg-add-btn');
    if (msgMenu && msgMenu.classList.contains('active') && e.target !== msgBtn && !msgBtn.contains(e.target) && !msgMenu.contains(e.target)) {
        msgMenu.classList.remove('active');
    }
});

// ==========================================
// 新建单人聊天 & 分组管理逻辑
// ==========================================
// ==========================================
// 新建单人聊天 & 分组管理逻辑
// ==========================================
let ncCustomGroups = ['未分组'];
let ncSelectedGroup = '未分组';

// 🌟 新增：通讯录核心数据源与当前选中 Tab 状态
let contactsList = [];
let msgCurrentTab = 'ALL';

// 🌟 动态更新个人资料页的小圆点头像
function updateProfileAvatars() {
    const container = document.getElementById('profile-bound-avatars');
    if(!container) return;
    container.innerHTML = '';
    let avatarsToShow = contactsList.filter(c => c.avatar).map(c => c.avatar).slice(0, 5);
    while(avatarsToShow.length < 5) { avatarsToShow.push("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"); }
    avatarsToShow.forEach((src, index) => {
        let styleStr = `z-index: ${5 - index};`; 
        if (src.includes("data:image/gif")) styleStr += " background: #ccc;"; 
        container.innerHTML += `<img src="${src}" class="notch-avatar-img" style="${styleStr}">`;
    });
}

// 🌟 新增：开机从 Dexie 数据库拉取通讯录真实数据
async function loadContactsData() {
    try {
        const dbData = await db.settings.get('contacts_data');
        if (dbData && dbData.value) { contactsList = JSON.parse(dbData.value); }
        renderMsgList();
        updateProfileAvatars();
    } catch (e) { console.error("通讯录读取失败", e); }
}

// 新建单人的身份绑定逻辑
let tempNcBoundProfileId = 'default';

function renderNcProfileMenu() {
    const menu = document.getElementById('ncProfileMenu');
    if (!menu) return;
    menu.innerHTML = '';
    let currentName = '系统默认身份';
    profilePlans.forEach(plan => {
        if (plan.id === tempNcBoundProfileId) currentName = plan.name;
        const div = document.createElement('div');
        div.className = 'cs-profile-option'; div.innerText = plan.name;
        div.onclick = () => { tempNcBoundProfileId = plan.id; document.getElementById('nc-bound-profile-name').innerText = plan.name; menu.classList.remove('active'); };
        menu.appendChild(div);
    });
    document.getElementById('nc-bound-profile-name').innerText = currentName;
}

function toggleNcProfileMenu() { document.getElementById('ncProfileMenu').classList.toggle('active'); }

function openNewContactSheet() {
    document.getElementById('msg-popover-menu').classList.remove('active');
    document.getElementById('nc-sheet-overlay').classList.add('active');
    document.getElementById('nc-bottom-sheet').classList.add('active');
    
    document.getElementById('text-nc-name').innerText = '新角色';
    ncSelectedGroup = '未分组';
    document.getElementById('nc-group-dogtag').innerText = ncSelectedGroup;
    
    const card = document.getElementById('nc-secretFileCard');
    const sw = document.getElementById('nc-secretToggleSwitch');
    card.classList.add('closed'); card.classList.remove('open');
    sw.classList.remove('active');
    
    tempNcBoundProfileId = 'default';
    renderNcProfileMenu();
}

function closeNewContactSheet() {
    document.getElementById('nc-sheet-overlay').classList.remove('active');
    document.getElementById('nc-bottom-sheet').classList.remove('active');
}

function toggleNcSecretFile() {
    const sw = document.getElementById('nc-secretToggleSwitch');
    const card = document.getElementById('nc-secretFileCard');
    sw.classList.toggle('active');
    if(sw.classList.contains('active')) {
        card.classList.remove('closed'); card.classList.add('open');
    } else {
        card.classList.add('closed'); card.classList.remove('open');
    }
}

// --- 🌟 分组弹窗控制 (改成一键直达列表) ---
let activeGroupEditMode = 'nc'; 
let csSelectedGroup = '未分组'; 

function openNcGroupInitMenu(mode = 'nc') {
    activeGroupEditMode = mode;
    let currentGrp = mode === 'nc' ? ncSelectedGroup : csSelectedGroup;
    document.getElementById('nc-current-group-display-init').innerText = currentGrp;
    
    const list = document.getElementById('ncGroupListDirect');
    if (list) {
        list.innerHTML = '';
        ncCustomGroups.forEach(group => {
            const item = document.createElement('div');
            item.className = 'model-item-btn';
            item.style.display = 'flex'; item.style.justifyContent = 'space-between'; item.style.alignItems = 'center';
            item.innerHTML = `
                <span onclick="selectNcGroup('${group}')" style="flex:1;">${group}</span>
                ${group !== '未分组' ? `<span onclick="deleteNcGroup('${group}', event)" style="color:#ff3b30; font-size:12px; font-weight:bold; padding: 5px;">删除</span>` : ''}
            `;
            list.appendChild(item);
        });
    }
    document.getElementById('ncGroupInitMenuOverlay').classList.add('active');
}

function closeNcGroupInitMenu() { document.getElementById('ncGroupInitMenuOverlay').classList.remove('active'); }

function triggerNewNcGroup() {
    closeNcGroupInitMenu();
    openNcCustomPrompt('新建角色分组', 'action_new_nc_group', '输入分组名称', 'input');
}

function selectNcGroup(group) {
    if (activeGroupEditMode === 'nc') {
        ncSelectedGroup = group;
        if(document.getElementById('nc-group-dogtag')) document.getElementById('nc-group-dogtag').innerText = group;
    } else {
        csSelectedGroup = group;
        if(document.getElementById('cs-group-dogtag')) document.getElementById('cs-group-dogtag').innerText = group;
    }
    closeNcGroupInitMenu();
}

function deleteNcGroup(group, e) {
    e.stopPropagation();
    ncGroupToDelete = group;
    openNcCustomPrompt('删除分组', 'action_delete_nc_group', `确定彻底删除分组 [${group}] 吗？`, 'confirm_delete');
}

// ==========================================
// 🚀 新建单人：完全独立解耦的逻辑 (带有 nc 专属前缀)
// ==========================================

// 点击外部关闭新建单人的头像菜单
document.addEventListener('click', function(e) {
    const ncMenu = document.getElementById('ncAvatarActionMenu');
    const ncAvatar = document.getElementById('img-nc-avatar');
    if (ncMenu && ncMenu.classList.contains('active') && e.target !== ncMenu && e.target !== ncAvatar) {
        ncMenu.classList.remove('active');
    }
});

// 独立头像控制逻辑
function toggleNcAvatarMenu() { document.getElementById('ncAvatarActionMenu').classList.toggle('active'); }
function changeNcAvatarLink() { 
    toggleNcAvatarMenu(); 
    openNcCustomPrompt('输入图片链接', 'nc-avatar-url', ''); 
}
function triggerNcLocalAvatar() { document.getElementById('ncLocalAvatarInput').click(); toggleNcAvatarMenu(); }
function uploadNcLocalAvatar(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { document.getElementById('img-nc-avatar').src = e.target.result; };
    reader.readAsDataURL(file);
}

// =======================================================
// 🚀 新建单人独立弹窗系统 (支持：输入 & 二次确认删除)
// =======================================================

let ncCurrentPromptTarget = '';
let ncCurrentPromptType = 'input'; 
let ncGroupToDelete = ''; 

function openNcCustomPrompt(title, targetId, defaultStr, type = 'input') {
    ncCurrentPromptTarget = targetId;
    ncCurrentPromptType = type;
    
    document.getElementById('ncPromptTitle').innerText = title;
    const inputEl = document.getElementById('ncPromptInput');
    const msgEl = document.getElementById('ncPromptMsg');
    const confirmBtn = document.getElementById('ncPromptConfirmBtn');
    
    confirmBtn.className = 'prompt-btn confirm'; // 还原黑色默认按钮
    
    if (type === 'input') {
        inputEl.style.display = 'block';
        msgEl.style.display = 'none';
        let currentVal = '';
        if (targetId === 'text-nc-name' || targetId === 'text-nc-sign') {
            currentVal = document.getElementById(targetId).innerText;
        }
        inputEl.value = currentVal === defaultStr ? '' : currentVal;
        
        document.getElementById('ncCustomPromptOverlay').classList.add('active');
        inputEl.focus();
    } else if (type === 'confirm_delete') {
        inputEl.style.display = 'none';
        msgEl.style.display = 'block';
        msgEl.innerText = defaultStr; // 显示警告文字
        confirmBtn.classList.add('danger'); // 变成红底删除按钮
        
        document.getElementById('ncCustomPromptOverlay').classList.add('active');
    }
}

function closeNcCustomPrompt() {
    document.getElementById('ncCustomPromptOverlay').classList.remove('active');
    ncCurrentPromptTarget = '';
}

function confirmNcCustomPrompt() {
    if (ncCurrentPromptType === 'confirm_delete') {
        if (ncCurrentPromptTarget === 'action_delete_nc_group') {
            ncCustomGroups = ncCustomGroups.filter(g => g !== ncGroupToDelete);
            // 同步恢复两个页面的被删分组
            if (ncSelectedGroup === ncGroupToDelete) {
                ncSelectedGroup = '未分组';
                if(document.getElementById('nc-group-dogtag')) document.getElementById('nc-group-dogtag').innerText = ncSelectedGroup;
            }
            if (csSelectedGroup === ncGroupToDelete) {
                csSelectedGroup = '未分组';
                if(document.getElementById('cs-group-dogtag')) document.getElementById('cs-group-dogtag').innerText = csSelectedGroup;
            }
            let currentGrp = activeGroupEditMode === 'nc' ? ncSelectedGroup : csSelectedGroup;
            document.getElementById('nc-current-group-display-init').innerText = currentGrp;
            renderNcGroupList();

        } else if (ncCurrentPromptTarget === 'action_delete_contact') {
            // 🌟 新增：处理真正的删除联系人逻辑
            contactsList = contactsList.filter(c => c.id !== contactIdToDelete);
            saveToDB('contacts_data', JSON.stringify(contactsList)); // 保存到数据库
            renderMsgList(); // 重新渲染列表让它消失
            showToast('角色已彻底删除');
            
            // 🌟 核心：如果是从设置页深处删除的，智能退回桌面，关掉所有内页
            if (currentChatContactId === contactIdToDelete) {
                closeChatSettings();
                closeChatRoom();
            }
            contactIdToDelete = null;
        }

    } else {
        const val = document.getElementById('ncPromptInput').value.trim();
        if (ncCurrentPromptTarget === 'nc-avatar-url') {
            if(val !== "") document.getElementById('img-nc-avatar').src = val;
        } else if (ncCurrentPromptTarget === 'action_new_nc_group') {
            if(val !== "") {
                if(!ncCustomGroups.includes(val)) ncCustomGroups.push(val);
                selectNcGroup(val); 
            }
        } else if (ncCurrentPromptTarget) {
            const el = document.getElementById(ncCurrentPromptTarget);
            // 针对真名和备注给出不同的默认兜底文字
            let defaultText = '新角色';
            if (ncCurrentPromptTarget === 'text-nc-remark') defaultText = '点击设置备注';
            
            if (el) el.innerText = val === "" ? defaultText : val;
        }
    }
    closeNcCustomPrompt();
}

// 核心重写：保存新建单人（大字显示备注或真名，下方灰字留白给未来的聊天记录）
function saveNewContact() {
    const avatar = document.getElementById('img-nc-avatar').src;
    const realName = document.getElementById('text-nc-name').innerText.trim();
    const remark = document.getElementById('text-nc-remark').innerText.trim();
    
    // 识别有没有认真填
    // 🌟 修复Bug：将默认占位名从生硬的“未命名角色”统一改为顺耳的“新角色”，彻底解决被过滤的问题
    const finalRealName = (realName === '新角色' || realName === '在这里输入真实名称' || realName === '') ? '新角色' : realName;
    
    // UI 显示逻辑：主标题大字 (如果有备注，优先显示备注，否则显示真名)

    let displayTitle = finalRealName;
    if (remark !== '点击设置备注' && remark !== '') {
        displayTitle = remark;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newContact = {
        id: 'contact_' + Date.now(),
        avatar: avatar,
        name: displayTitle,   // 列表大字位 
        sign: "",             // 🌟 核心修改：下方灰字代表“最后一条消息”，新建时没聊过天，直接给个空字符串，绝对留白！
        group: ncSelectedGroup, 
        chatType: 'FRIEND', 
        time: timeStr
    };

    newContact.boundProfileId = tempNcBoundProfileId;
    newContact.details = { tag1: document.getElementById('input-nc-tag1').value.trim() };

    contactsList.push(newContact);
    saveToDB('contacts_data', JSON.stringify(contactsList));
    updateProfileAvatars(); // 实时刷新“我的资料”页的小头像串！

    showToast(`成功添加：${displayTitle}`);

    closeNewContactSheet();
    
    const allTabBtn = document.querySelector('.msg-sub-tab');
    if(allTabBtn) switchMsgSubTab(allTabBtn, 'ALL');
    else renderMsgList();
}



// 3. 彻底重写（覆盖）Tab 分类切换函数！
function switchMsgSubTab(el, type) {
    // 移除所有标签的 active 状态
    const tabs = document.querySelectorAll('.msg-sub-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    // 给点中的标签加上黑线动画
    el.classList.add('active');
    
    // 记录当前选中的类型，并触发重新渲染
    msgCurrentTab = type;
    renderMsgList();
}

// 4. 核心：双轨动态生成列表 (自定义分组为独立置顶卡片，未分组为包裹大卡片)
function renderMsgList() {
    const unpinnedContainer = document.getElementById('msg-unpinned-list');
    const pinnedContainer = document.getElementById('msg-pinned-list'); // 🌟 置顶专属容器
    const placeholder = document.getElementById('msg-placeholder-text');
    if (!unpinnedContainer || !placeholder || !pinnedContainer) return;

    unpinnedContainer.innerHTML = ''; 
    pinnedContainer.innerHTML = '';   
    
    // 按顶部分类过滤 (好友/群聊/其他)
    let filtered = contactsList;
    if (msgCurrentTab === 'FRIENDS') {
        filtered = contactsList.filter(c => c.chatType === 'FRIEND');
    } else if (msgCurrentTab === 'GROUPS') {
        filtered = contactsList.filter(c => c.chatType === 'GROUP');
    } else if (msgCurrentTab === 'OTHERS') {
        filtered = contactsList.filter(c => c.chatType === 'OTHER');
    }

    // 🌟 核心分流：判断是否使用了自定义分组
    const pinnedContacts = filtered.filter(c => c.group !== '未分组');
    const unpinnedContacts = filtered.filter(c => c.group === '未分组');

    // 如果该分类下彻底没数据，显示占位文字
    if (filtered.length === 0) {
        unpinnedContainer.style.display = 'none';
        pinnedContainer.style.display = 'none';
        placeholder.style.display = 'block';
        const map = { 'ALL': '消息', 'FRIENDS': '好友', 'GROUPS': '群聊', 'OTHERS': '其他' };
        placeholder.innerHTML = `暂无 ${map[msgCurrentTab]} 数据`;
        return;
    }

    placeholder.style.display = 'none';
    pinnedContainer.style.display = 'flex';

    // 🌟 渲染 1：置顶角色 (独立小长方形白卡片)
    pinnedContacts.forEach(c => {
        const dogTagHtml = `<span class="msg-dog-tag">${c.group}</span>`;
        const item = document.createElement('div');
        item.className = 'msg-chat-card pinned'; // 使用独立卡片样式
        item.onclick = () => openChatRoom(c.id);
        
        // 绑定了相同的长按引擎，长按名字即可删除
        item.innerHTML = `
            <div class="msg-avatar-wrapper">
                <img src="${c.avatar}" class="msg-avatar-img">
                <div class="msg-avatar-glass"></div>
            </div>
            <div class="msg-info-wrapper">
                <div class="msg-name"
                    ontouchstart="handleLongPressStart(event, '${c.id}')" 
                    ontouchend="handleLongPressEnd(event)" 
                    ontouchmove="handleLongPressEnd(event)"
                    onmousedown="handleLongPressStart(event, '${c.id}')"
                    onmouseup="handleLongPressEnd(event)"
                    onmouseleave="handleLongPressEnd(event)"
                >${c.name} ${dogTagHtml}</div>
                <div class="msg-last-text">${c.sign}</div>
            </div>
            <div class="msg-time">${c.time}</div>
        `;
        pinnedContainer.appendChild(item);
    });

    // 🌟 渲染 2：未分组角色 (被包裹在下面的大白卡片里)
    if (unpinnedContacts.length > 0) {
        unpinnedContainer.style.display = 'flex';
        unpinnedContacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'msg-chat-item'; // 使用包裹条目样式
            item.onclick = () => openChatRoom(c.id);
            item.innerHTML = `
                <div class="msg-avatar-wrapper">                    <img src="${c.avatar}" class="msg-avatar-img">
                    <div class="msg-avatar-glass"></div>
                </div>
                <div class="msg-info-wrapper">
                    <div class="msg-name"
                        ontouchstart="handleLongPressStart(event, '${c.id}')" 
                        ontouchend="handleLongPressEnd(event)" 
                        ontouchmove="handleLongPressEnd(event)"
                        onmousedown="handleLongPressStart(event, '${c.id}')"
                        onmouseup="handleLongPressEnd(event)"
                        onmouseleave="handleLongPressEnd(event)"
                    >${c.name}</div>
                    <div class="msg-last-text">${c.sign}</div>
                </div>
                <div class="msg-time">${c.time}</div>
            `;
            unpinnedContainer.appendChild(item);
        });
    } else {
        unpinnedContainer.style.display = 'none'; // 如果没有未分组的，自动隐藏下方大白卡
    }
}

// ==========================================
// 🌟 核心功能：长按名字呼出删除弹窗
// ==========================================
let longPressTimer;
let contactIdToDelete = null;

function handleLongPressStart(event, id) {
    event.stopPropagation(); // 阻止点击事件穿透
    
    // 开启 600 毫秒的长按定时器
    longPressTimer = setTimeout(() => {
        promptDeleteContact(id);
    }, 600); 
}

function handleLongPressEnd(event) {
    event.stopPropagation();
    // 手指松开或滑走时，立刻取消定时器
    if (longPressTimer) {
        clearTimeout(longPressTimer);
    }
}

function promptDeleteContact(id) {
    contactIdToDelete = id;
    // 呼出极致纯白的二次确认窗
    openNcCustomPrompt('删除联系人', 'action_delete_contact', '确定要彻底删除此角色吗？此操作将清除其相关资料与聊天记录（不包括绑定的世界书）。', 'confirm_delete');
}

// ==========================================
// 🌟 核心功能：原生级聊天室内页交互
// ==========================================
let currentChatContactId = null;

function closeChatRoom() {
    document.getElementById('chatRoomScreen').classList.remove('active');
    currentChatContactId = null;
}

function openChatRoom(contactId) {
    currentChatContactId = contactId;
    const contact = contactsList.find(c => c.id === contactId);
    if (!contact) return;
    
    document.getElementById('chatRoomTitle').innerText = contact.name; 
    document.getElementById('chat-init-name-display').innerText = contact.name;
    
    // 🔥 核心分离：如果这个角色有专门设置的“聊天室内大头像”就用它，没有就用列表小头像兜底
    const bigAvatar = contact.chatRoomAvatar || contact.avatar;
    document.getElementById('img-chat-init-avatar').src = bigAvatar;

    // --- 🌟 渲染历史消息引擎 ---
    const chatBody = document.getElementById('chatRoomBody');
    // 第一步：清空除“打招呼占位区”以外的所有历史气泡，防止角色串门
    Array.from(chatBody.children).forEach(child => {
        if (child.id !== 'chatInitState') {
            child.remove();
        }
    });

    // 第二步：从数据库读取并渲染此角色的历史消息
    if (contact.messages && contact.messages.length > 0) {
        const myAvatar = document.getElementById('img-sidebar-avatar').src;
        const charAvatar = bigAvatar;

        contact.messages.forEach(msg => {
            const safeText = msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
            let msgHtml = '';
            if (msg.sender === 'user') {
                msgHtml = `
                <div class="preview-msg-row right">
                    <div class="Toutou-TT user">
                        <span class="bubble-time">${msg.time}</span>
                        <div class="content">${safeText}</div>
                    </div>
                    <img src="${myAvatar}" class="preview-avatar">
                </div>
                `;
            } else {
                msgHtml = `
                <div class="preview-msg-row left">
                    <img src="${charAvatar}" class="preview-avatar">
                    <div class="Toutou-TT char">
                        <div class="content">${safeText}</div>
                        <span class="bubble-time">${msg.time}</span>
                    </div>
                </div>
                `;
            }
            chatBody.insertAdjacentHTML('beforeend', msgHtml);
        });

        // 智能滚到底部查看最新消息
        setTimeout(() => {
            chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'auto' });
        }, 10);
    }
    
    document.getElementById('chatRoomScreen').classList.add('active');
}

// 🌟 全新逻辑：聊天室内大型头像上传与菜单控制
function toggleChatInitAvatarMenu(event) { event.stopPropagation(); document.getElementById('chatInitAvatarMenu').classList.toggle('active'); }

// 点击外部关闭头像弹窗
document.addEventListener('click', function(e) {
    const menu = document.getElementById('chatInitAvatarMenu');
    const avatar = document.getElementById('img-chat-init-avatar');
    if (menu && menu.classList.contains('active') && e.target !== menu && e.target !== avatar) { 
        menu.classList.remove('active'); 
    }
});

function changeChatInitAvatarLink() { 
    document.getElementById('chatInitAvatarMenu').classList.remove('active'); 
    openCustomPrompt('输入图片链接', 'chat-init-avatar-url', '', 'input'); 
}

function triggerChatInitLocalAvatar() { 
    document.getElementById('chatInitAvatarMenu').classList.remove('active'); 
    document.getElementById('chatInitLocalAvatarInput').click(); 
}

// 核心同步：换大头像后，只保存为独立属性，绝对不触发列表渲染！
function uploadChatInitLocalAvatar(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const newAvatarData = e.target.result;
        document.getElementById('img-chat-init-avatar').src = newAvatarData;
        if (currentChatContactId) {
            const contact = contactsList.find(c => c.id === currentChatContactId);
            if (contact) {
                contact.chatRoomAvatar = newAvatarData;
                saveToDB('contacts_data', JSON.stringify(contactsList));
            }
        }
    };
    reader.readAsDataURL(file);
}

// ==========================================
// 🌟 角色专属聊天设置页逻辑
// ==========================================
let tempBoundProfileId = 'default';

function openChatSettings() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    document.getElementById('cs-avatar').src = contact.avatar;
    document.getElementById('cs-realname').value = contact.realName || (contact.remark ? contact.name : (contact.name !== '未命名角色' ? contact.name : ''));
    document.getElementById('cs-remark').value = contact.remark || (contact.name !== contact.realName ? contact.name : '');
    
    // 读取详情数据
    const details = contact.details || {};
    document.getElementById('cs-gender').value = details.gender || '';
    document.getElementById('cs-age').value = details.age || '';
    document.getElementById('cs-location').value = details.location || '';
    document.getElementById('display-cs-birthday').value = details.birthday || '';
    document.getElementById('cs-zodiac').value = details.zodiac || '';
    
    // 读取标签和档案
    document.getElementById('cs-tag1').value = details.tag1 || '';
    document.getElementById('cs-secret-file').value = details.secretFile || '';

    // 渲染档案开关
    if(details.secretMode) {
        document.getElementById('cs-secretToggleSwitch').classList.add('active');
        document.getElementById('cs-secretFileCard').classList.remove('closed');
        document.getElementById('cs-secretFileCard').classList.add('open');
    } else {
        document.getElementById('cs-secretToggleSwitch').classList.remove('active');
        document.getElementById('cs-secretFileCard').classList.add('closed');
        document.getElementById('cs-secretFileCard').classList.remove('open');
    }

    // 渲染分组狗牌
    csSelectedGroup = contact.group || '未分组';
    document.getElementById('cs-group-dogtag').innerText = csSelectedGroup;

    tempBoundProfileId = contact.boundProfileId || 'default';
    renderCsProfileMenu();

    // 🌟 动态联动预览区头像
    // 左侧：读取当前角色的头像
    const charAvatarEl = document.getElementById('preview-avatar-char');
    if(charAvatarEl) charAvatarEl.src = contact.avatar;
    
    // 右侧：读取我方当前绑定的主头像（从侧边栏读取最准确）
    const myAvatarEl = document.getElementById('preview-avatar-user');
    const mySidebarAvatar = document.getElementById('img-sidebar-avatar');
    if(myAvatarEl && mySidebarAvatar) {
        myAvatarEl.src = mySidebarAvatar.src;
    }

    document.getElementById('chatSettingsScreen').classList.add('active');
}

function closeChatSettings() {
    document.getElementById('chatSettingsScreen').classList.remove('active');
}

// 渲染身份下拉菜单
function renderCsProfileMenu() {
    const menu = document.getElementById('csProfileMenu');
    menu.innerHTML = '';
    let currentName = '系统默认身份';

    profilePlans.forEach(plan => {
        if (plan.id === tempBoundProfileId) currentName = plan.name;
        const div = document.createElement('div');
        div.className = 'cs-profile-option';
        div.innerText = plan.name;
        div.onclick = () => {
            tempBoundProfileId = plan.id;
            document.getElementById('cs-bound-profile-name').innerText = plan.name;
            menu.classList.remove('active');
        };
        menu.appendChild(div);
    });
    document.getElementById('cs-bound-profile-name').innerText = currentName;
}

function toggleCsProfileMenu() {
    document.getElementById('csProfileMenu').classList.toggle('active');
}

// 设置页的列表小头像上传
function triggerCsLocalAvatar() { document.getElementById('csLocalAvatarInput').click(); }
function uploadCsLocalAvatar(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { document.getElementById('cs-avatar').src = e.target.result; };
    reader.readAsDataURL(file);
}

// 保存所有设置
function saveChatSettings() {
    if (!currentChatContactId) return;
    const contactIndex = contactsList.findIndex(c => c.id === currentChatContactId);
    if (contactIndex === -1) return;

    const realName = document.getElementById('cs-realname').value.trim();
    const remark = document.getElementById('cs-remark').value.trim();
    
    // 逻辑：有备注优先显示备注，没备注显示真名
    let finalDisplayName = remark !== '' ? remark : (realName !== '' ? realName : '新角色');
    const oldName = contactsList[contactIndex].name; // 记录旧名字


    contactsList[contactIndex].avatar = document.getElementById('cs-avatar').src; 
    contactsList[contactIndex].realName = realName;
    contactsList[contactIndex].remark = remark;
    contactsList[contactIndex].name = finalDisplayName; 
    contactsList[contactIndex].boundProfileId = tempBoundProfileId; 
    contactsList[contactIndex].group = csSelectedGroup; 

    contactsList[contactIndex].details = {
        gender: document.getElementById('cs-gender').value.trim(),
        age: document.getElementById('cs-age').value.trim(),
        location: document.getElementById('cs-location').value.trim(),
        birthday: document.getElementById('display-cs-birthday').value.trim(),
        zodiac: document.getElementById('cs-zodiac').value.trim(),
        tag1: document.getElementById('cs-tag1').value.trim(),
        secretFile: document.getElementById('cs-secret-file').value,
        secretMode: document.getElementById('cs-secretToggleSwitch').classList.contains('active')
    };

    saveToDB('contacts_data', JSON.stringify(contactsList));

    // 🌟 核心串联：如果角色改名了，自动把世界书里绑定的名字也同步改过来！防止脱节
    if (oldName && oldName !== finalDisplayName) {
        let wbUpdated = false;
        activeWorldbooks.forEach(wb => {
            if (wb.category === '已绑定' && wb.subGroup === oldName) {
                wb.subGroup = finalDisplayName;
                wbUpdated = true;
            }
        });
        if (wbUpdated) {
            saveToDB('worldbooks_data', JSON.stringify(activeWorldbooks));
            recalcCategories(); // 刷新世界书里的分类白球
        }
    }

    renderMsgList(); // 同步列表页
    
    // 同步刷新当前聊天室内的名称
    document.getElementById('chatRoomTitle').innerText = finalDisplayName;
    document.getElementById('chat-init-name-display').innerText = finalDisplayName;

    showToast('设定已保存');
    closeChatSettings();
}

function promptDeleteContactFromSettings() {
    contactIdToDelete = currentChatContactId;
    // 全面接入统一超极简弹窗系统
    openNcCustomPrompt('删除角色', 'action_delete_contact', '确定要彻底删除此角色吗？此操作将清除其相关资料与聊天记录（不影响世界书）。', 'confirm_delete');
}


/// ====== 🌟 输入框自适应高度联动 (已去除回车发送，纯粹换行) ======
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatRoomInput');
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            // 每次输入时重置高度以获取真实的 scrollHeight
            this.style.height = 'auto'; 
            this.style.height = this.scrollHeight + 'px';
        });
        // 🌟 已经彻底删除了键盘回车拦截，现在敲击回车只会老老实实地在输入框内换行！
    }
});


// 🌟 核心：补全丢失的用户发送消息引擎
function sendChatMessage() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    const inputEl = document.getElementById('chatRoomInput');
    const text = inputEl.value.trim();
    if (!text) return; // 如果没有输入文字就不发送

    // 1. 立刻清空输入框并重置高度
    inputEl.value = '';
    inputEl.style.height = 'auto';

    // 2. 组装消息数据
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    if (!contact.messages) contact.messages = [];
    contact.messages.push({
        id: 'msg_' + Date.now(),
        sender: 'user',
        text: text,
        time: timeStr
    });

    // 3. 渲染到聊天室屏幕上
    const chatBody = document.getElementById('chatRoomBody');
    // 获取“我的”资料头像（从侧边栏读取）
    const mySidebarAvatar = document.getElementById('img-sidebar-avatar');
    const myAvatar = mySidebarAvatar ? mySidebarAvatar.src : 'https://i.pinimg.com/564x/bd/d9/39/bdd9392233f07a78c005b63001859942.jpg';
    
    // 防注入 & 将换行符转换为真实换行
    const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
    
    const msgHtml = `
    <div class="preview-msg-row right">
        <div class="Toutou-TT user">
            <span class="bubble-time">${timeStr}</span>
            <div class="content">${safeText}</div>
        </div>
        <img src="${myAvatar}" class="preview-avatar">
    </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', msgHtml);
    
    // 智能滚到底部查看最新发出的消息
    setTimeout(() => {
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    }, 10);

    // 4. 更新外层通讯录列表的最新一条消息摘要与时间，并存入数据库
    contact.sign = text.replace(/\n/g, ' ');
    contact.time = timeStr;
    saveToDB('contacts_data', JSON.stringify(contactsList));
    renderMsgList();
}

// ==========================================
// 🌟 飞机按钮单击/双击中控器 & AI 回复调度器
// ==========================================

let planeClickTimer = 0;
let isAiReplying = false; // 防止AI回复中途重复点击

function handlePlaneClick() {
    if (isAiReplying) return; // 正在回复时锁定按钮
    
    const now = Date.now();
    // 判断是否为 400ms 内的双击
    if (now - planeClickTimer < 400) {
        // 识别为双击：触发 AI 回复
        planeClickTimer = 0; // 清理时间
        triggerAiReply();
        return;
    }
    
    // 记录本次点击时间，并在延时内触发单次发送
    planeClickTimer = now;
    
    // 如果有文字，就当做发送消息处理
    const text = document.getElementById('chatRoomInput').value.trim();
    if (text) {
        sendChatMessage();
    }
}

// ==========================================
// 🌟 AI 回复调度器与系统级 Prompt 组装引擎
// ==========================================

// 组装完美的系统提示词 (根据你的规定顺序)
function buildSystemPrompt(contact) {
    // 1. 获取 user 资料 (当前生效的身份资料卡)
    let appliedProfile = profilePlans.find(p => p.id === currentActivePlanId) || profilePlans[0];
    let ud = appliedProfile.data || {};
    let userStr = `姓名: ${ud['text-profile-name']}\n性别: ${ud['text-detail-gender']}\n年龄: ${ud['text-detail-age']}\n`;
    if(ud['text-secret-file']) userStr += `个人档案: ${ud['text-secret-file']}\n`;

    // 2. 获取 char 资料
    let cd = contact.details || {};
    let charStr = `姓名: ${contact.realName || contact.name}\n对用户的备注: ${contact.remark}\n性别: ${cd.gender}\n年龄: ${cd.age}\n`;
    if(cd.secretFile) charStr += `专属设定与回忆: ${cd.secretFile}\n`;

    // 3. 组装世界书
    let wbStr = "";
    let charWbs = activeWorldbooks.filter(b => b.category === '已绑定' && b.subGroup === contact.name);
    let commonWbs = activeWorldbooks.filter(b => b.category === '通用');
    let otherWbs = activeWorldbooks.filter(b => b.category === '全部');

    const parseEntries = (wbs) => {
        let s = "";
        wbs.forEach(wb => { wb.entries.forEach(e => { s += `- [${e.name}](${e.trigger}): ${e.content}\n`; }); });
        return s;
    };
    if(charWbs.length > 0) wbStr += "【专属世界书】\n" + parseEntries(charWbs);
    if(commonWbs.length > 0) wbStr += "【通用世界书】\n" + parseEntries(commonWbs);
    if(otherWbs.length > 0) wbStr += "【全局世界书】\n" + parseEntries(otherWbs);

    // 4. 终极 Prompt (严格执行人设、去油腻约束与分句排版要求)
    return `你需要扮演 {char}，模拟真实生活中的聊天软件来回复我 {user}。

【扮演与性格核心约束】
你只会回复以char的身份与user进行聊天，不许代替user进行回复。
1. 绝对生活化口语：使用大白话、符合角色设定性格的来回复，拒绝文绉绉、拒绝说教、拒绝机械重复我的话、拒绝反问、拒绝重复同一个话题与无进展的对话、拒绝威胁性的话。
2. 情绪红线：不允许物化、打压，不允许太过暴躁。尽量扮演让女性满意的角色，提供心动感与沉浸感。
3. 展现潜台词：对话不一定要干巴巴地交代事件或信息，可以只是一句闲聊，也可以是胡说八道，甚至脑子一热说错话。善用潜台词（例如：一个爱逞强的人受伤后说话跟没事人一样，突然倒下）。
4. 拒绝油腻与套路：不要油腻，拒绝霸总式、模板化、常规化的回复与人物理解。在角色设定允许的情况下，你可以只回复一句话或一个标点符号。比如发很多省略号，句号，逗号等。绝对不允许OOC。你是去模拟一个真实的人聊天，所以生气、开心、无语，等情绪都是可以拥有的。同时也可以发送颜文字和网络热梗以及表情包（人物设定允许的情况下）。
5. 推动剧情与时间流动：每次说出的话，尽量要推动剧情和事件发展，而非停在原地不转、反复纠结一件事。比如（你参考这个）：比如这时候晚上7:30在说吃饭，你可以模拟真人自然地说“准备去洗澡了”等生活行为，让对话具备真实的流动感。但不要总重复之前（短时间内）说过/相似的话。
以上所有规定建立在不ooc，完全符合人物性格、设定的情况。始终遵守人物设定与角色绑定世界观！每次将要输出时，请再次问自己，这次的话确定完全符合人物设定吗？

【user 设定相关 (我)】
${userStr}
【char 设定相关 (你)】
${charStr}
【世界观设定】
${wbStr}

【多条消息连发格式要求 (极为重要) 】
为了模拟真实聊天中“连发多条短消息”的压迫感或生动感，如果你想分几次发送不同的话，请务必使用 ||| 作为消息分割符。
例如：干嘛呢|||怎么不理我[生气]|||再不说话我挂了啊
系统会自动将这段话切分成三个独立的聊天气泡。如果没有必要分开发送，直接正常回复即可，同一气泡内可以使用换行。千万不要自己带上“发送”等多余的动作词。`;
}

// 解析 AI 回复，切割出多气泡
function handleAiResponse(text, contact) {
    // 按照我们教给 AI 的特殊符号 ||| 来切割句子
    const parts = text.split('|||').map(s => s.trim()).filter(s => s);
    if(parts.length === 0) return;

    const chatBody = document.getElementById('chatRoomBody');
    const charAvatar = contact.chatRoomAvatar || contact.avatar;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 利用稍微的延迟，实现多个气泡“接连弹出”的视觉体验
    parts.forEach((part, index) => {
        setTimeout(() => {
            if (!contact.messages) contact.messages = [];
            contact.messages.push({
                id: 'msg_' + Date.now() + '_' + index, sender: 'char', text: part, time: timeStr
            });
            
            // 防注入渲染，并将换行符替换为真正的 br 换行
            const safeText = part.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
            const msgHtml = `
            <div class="preview-msg-row left">
                <img src="${charAvatar}" class="preview-avatar">
                <div class="Toutou-TT char">
                    <div class="content">${safeText}</div>
                    <span class="bubble-time">${timeStr}</span>
                </div>
            </div>
            `;
            chatBody.insertAdjacentHTML('beforeend', msgHtml);
            chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });

            // 更新外层列表最后一条消息和时间 (以最后一个气泡为准)
            if (index === parts.length - 1) {
                contact.sign = part.replace(/\n/g, ' ');
                contact.time = timeStr;
                saveToDB('contacts_data', JSON.stringify(contactsList));
                renderMsgList();
            }
        }, index * 400); // 每个气泡间隔 400ms 弹出
    });
}

// 核心调度入口
async function triggerAiReply() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    if (!activeApiPlanId || apiPlans.length === 0) { showToast("请先在API设置中配置并应用方案！"); return; }
    const apiConfig = apiPlans.find(p => p.id === activeApiPlanId)?.data;
    if (!apiConfig || !apiConfig.apiKey) { showToast("未检测到有效的 API Key！"); return; }

    isAiReplying = true;

    // 🌟 核心交互：将原本的备注名替换为正在输入中，彻底删去底栏动画药丸
    const titleEl = document.getElementById('chatRoomTitle');
    const originalName = titleEl.innerText;
    titleEl.innerText = "对方正在输入中...";

    if (apiConfig.stream) {
        showToast("流式渲染模块对接中...");
        setTimeout(() => { 
            titleEl.innerText = originalName; 
            isAiReplying = false; 
        }, 1000);
        return; 
    }

    // --- 准备发送给 API 的数据 ---
    let messagesPayload = [];
    // 塞入世界观、身份卡和扮演规范
    messagesPayload.push({ role: "system", content: buildSystemPrompt(contact) });
    // 塞入你们俩的历史聊天记录
    if (contact.messages && contact.messages.length > 0) {
        contact.messages.forEach(m => {
            messagesPayload.push({ role: m.sender === 'user' ? "user" : "assistant", content: m.text });
        });
    } else {
        // 如果没有聊天记录，让AI主动破冰
        messagesPayload.push({ role: "system", content: "这是你们的第一句话，请主动跟对方打招呼破冰。" });
    }

    try {
        const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.apiKey}`
            },
            body: JSON.stringify({
                model: apiConfig.model,
                messages: messagesPayload,
                temperature: parseFloat(apiConfig.temp),
                presence_penalty: parseFloat(apiConfig.pres),
                frequency_penalty: parseFloat(apiConfig.freq),
                top_p: parseFloat(apiConfig.topp)
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || "请求失败");
        }

        const data = await response.json();
        const replyText = data.choices[0].message.content;

        // 🌟 成功获取回复后，恢复顶栏备注名
        titleEl.innerText = originalName;
        
        // 传递给多气泡处理引擎渲染
        handleAiResponse(replyText, contact);

    } catch (error) {
        // 🌟 请求出错时，同样要恢复顶栏备注名
        titleEl.innerText = originalName;
        showToast("API 错误: " + error.message);
    }

    isAiReplying = false;
}

// ====== 🌟 角色专属聊天设置页 - 头像菜单与绝密档案 ======
function toggleCsAvatarMenu(event) { event.stopPropagation(); document.getElementById('csAvatarActionMenu').classList.toggle('active'); }
function changeCsAvatarLink() { document.getElementById('csAvatarActionMenu').classList.remove('active'); openCustomPrompt('输入图片链接', 'cs-avatar-url', '', 'input'); }

document.addEventListener('click', function(e) {
    const csMenu = document.getElementById('csAvatarActionMenu');
    const csAvatar = document.getElementById('cs-avatar');
    if (csMenu && csMenu.classList.contains('active') && e.target !== csMenu && e.target !== csAvatar) {
        csMenu.classList.remove('active');
    }
});

function toggleCsSecretFile() {
    const sw = document.getElementById('cs-secretToggleSwitch');
    const card = document.getElementById('cs-secretFileCard');
    sw.classList.toggle('active');
    if(sw.classList.contains('active')) {
        card.classList.remove('closed'); card.classList.add('open');
    } else {
        card.classList.add('closed'); card.classList.remove('open');
    }
}

/* ==========================================
   🌟 唯一关键词：【气泡主题选择交互】
========================================== */
const bubbleThemes = {
    '黑灰': { ub: '#000000', ut: '#ffffff', cb: '#F1F1F3', ct: '#000000' },
    '薄巧': { ub: '#D0ECEA', ut: '#56515D', cb: '#81716F', ct: '#ffffff' },
    '黄绿': { ub: '#FBFDE6', ut: '#C0C2A9', cb: '#F4F9F5', ct: '#999E94' },
    '紫紫': { ub: '#E6E1FF', ut: '#747379', cb: '#F5F4FF', ct: '#747379' },
    '黑粉': { ub: '#FFF4F8', ut: '#585858', cb: '#000000', ct: '#ffffff' },
    '蓝粉': { ub: '#FFEFF2', ut: '#31363C', cb: '#EBF4FD', ct: '#31363C' }
};

function selectBubbleTheme(themeName, el) {
    const items = document.querySelectorAll('.bubble-theme-item');
    items.forEach(item => item.classList.remove('active'));
    if(el) el.classList.add('active');
    
    const t = bubbleThemes[themeName];
    if(t) {
        document.documentElement.style.setProperty('--bubble-user-bg', t.ub);
        document.documentElement.style.setProperty('--bubble-user-text', t.ut);
        document.documentElement.style.setProperty('--bubble-char-bg', t.cb);
        document.documentElement.style.setProperty('--bubble-char-text', t.ct);
        
        saveToDB('color_bubble-user-bg', t.ub);
        saveToDB('color_bubble-user-text', t.ut);
        saveToDB('color_bubble-char-bg', t.cb);
        saveToDB('color_bubble-char-text', t.ct);
    }
    showToast(`已应用：${themeName} 配色`);
}
