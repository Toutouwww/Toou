// 🌟 提取中文首字母的轻量级计算引擎
function getPinyinInitials(str) {
    const letters = "abcdefghjklmnopqrstwxyz".split('');
    const zh = "阿八嚓哒妸发旮哈讥咔垃妈拏噢妑七呥仨他哇夕丫匝".split('');
    let result = "";
    for (let char of str) {
        if (/[a-zA-Z]/.test(char)) {
            result += char.toLowerCase();
        } else if (/[\u4e00-\u9fa5]/.test(char)) {
            let found = false;
            for (let i = zh.length - 1; i >= 0; i--) {
                if (char.localeCompare(zh[i], 'zh-Hans-CN') >= 0) {
                    result += letters[i];
                    found = true;
                    break;
                }
            }
            if (!found) result += char;
        } else {
            result += char;
        }
    }
    return result;
}

// ==========================================
// 🌟 终极防错位系统：底层锁定与软键盘强回收
// ==========================================
function lockDesktopScroll() {
    const desktop = document.querySelector('.mobile-container');
    if (desktop) desktop.classList.add('no-scroll');
}

function unlockDesktopScroll() {
    const desktop = document.querySelector('.mobile-container');
    if (desktop) {
        desktop.classList.remove('no-scroll');
        desktop.scrollTop = 0; // 🌟 绝杀：强制桌面回到最顶部，消除一切软键盘留下的错位！
    }
    // 强制全局失焦，防止返回桌面时还有隐藏输入框卡着键盘
    if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
    }
    
    // 🌟 修复 iOS Safari/安卓键盘收起后整个页面飞天留白的系统级 Bug
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
}



// ==========================================
// 软件1：通讯应用软件的打开、关闭与标签切换
// ==========================================

function openAppChat(event) {
    lockDesktopScroll(); // 🌟 锁定桌面
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
    unlockDesktopScroll(); // 🌟 解锁桌面并强制复位
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
    lockDesktopScroll(); // 🌟 锁定桌面
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
    unlockDesktopScroll(); // 🌟 解锁桌面并强制复位
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
    
    // 🔥 核心修复：小白防呆设计！点一下立刻静默保存到当前运行方案，无需手动点“应用”
    if (activeApiPlanId) {
        const planIndex = apiPlans.findIndex(p => p.id === activeApiPlanId);
        if (planIndex > -1) {
            apiPlans[planIndex].data.stream = btn.classList.contains('active');
            saveToDB('qiandao_api_plans', JSON.stringify(apiPlans));
        }
    }
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
let currentCommonBoundChar = ''; // 🌟 新增：记录通用世界书附加绑定的角色

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
        if (b.category === '专属' && !bindedCharacters.includes(b.subGroup)) bindedCharacters.push(b.subGroup);
        else if (b.category === '通用' && !customCommonGroups.includes(b.subGroup)) customCommonGroups.push(b.subGroup);
    });
}

// 真实应用中这里将从数据库读取角色列表，目前为空
let availableChars = []; 
let lastPlanetClickTime = 0;


function openWorldbookApp(event) {
    lockDesktopScroll(); // 🌟 锁定桌面
    const overlay = document.getElementById('worldbookAppOverlay');
    if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        overlay.style.transformOrigin = `${rect.left + rect.width / 2}px ${rect.top + rect.height / 2}px`;
    } else {
        overlay.style.transformOrigin = 'center center';
    }
    
    isWbDeleteMode = false; 
    document.getElementById('wb-popover-menu').classList.remove('active'); 
    
    const track = document.getElementById('wb-planet-track');
    if(track) {
        const planets = track.querySelectorAll('.wb-planet');
        planets.forEach(p => {
            p.classList.remove('left', 'center', 'right');
            // 🌟 核心绝杀：必须用 textContent，innerText在弹窗隐身时会返回空字符串导致全盘崩溃！
            const txt = p.textContent.trim(); 
            if (txt === '通用') p.classList.add('left');
            else if (txt === '全部') p.classList.add('center');
            else if (txt === '专属') p.classList.add('right');
        });
    }

    document.getElementById('wb-current-view').innerText = '全部';
    renderWorldbookList('全部');
    
    overlay.classList.add('active');
}

function closeWorldbookApp() {
    document.getElementById('worldbookAppOverlay').classList.remove('active');
    closeCharSelector(); 
    document.getElementById('wb-popover-menu').classList.remove('active');
    unlockDesktopScroll(); // 🌟 解锁桌面并强制复位
}

// 🌟 唯一关键词：【星球点击安全读取】
function handlePlanetClick(clickedEl) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastPlanetClickTime;
    lastPlanetClickTime = currentTime;
    document.getElementById('wb-popover-menu').classList.remove('active'); 
    
    const txt = clickedEl.textContent.trim(); // 🌟 核心防错：必须使用 textContent，防止被隐身影响读取为空
    
    if (clickedEl.classList.contains('center')) {
        if (timeDiff < 350 && (txt === '专属' || txt === '通用')) {
            openCharSelector(txt);
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
    
    document.getElementById('wb-current-view').innerText = txt;
    renderWorldbookList(txt);
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
    const dataSource = type === '专属' ? bindedCharacters : customCommonGroups;

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
    const suffix = type === '专属' ? '的专属' : '分类';
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
    currentCommonBoundChar = ''; // 清空通用附加角色
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

    if (groupName === '专属') {
        groupBtns.style.display = 'none'; groupDisp.style.display = 'none';
        charBtn.style.display = 'block';
        updateCharBtnUI();
    } else if (groupName === '通用') {
        charBtn.style.display = 'none';
        groupBtns.style.display = 'flex'; 
        groupDisp.style.display = 'flex'; // 🌟 激活包裹层
        updateCommonGroupUI();
        updateCommonCharBtnUI(); // 🌟 激活通用专属的附加按钮
    } else {
        charBtn.style.display = 'none';
        groupBtns.style.display = 'none'; groupDisp.style.display = 'none';
    }
}

// -- 角色选择 (兼容通用世界书和专属世界书) --
function openCharSelectModal(isCommon = false) {
    const list = document.getElementById('charSelectList');
    list.innerHTML = '';
    document.querySelector('#charSelectOverlay .custom-prompt-title').innerText = isCommon ? '选择要附加绑定的角色' : '选择要绑定的角色';

    // 🌟 核心修改：优先提取真实姓名，如果没有再用显示名称兜底
    const availableChars = [...new Set(contactsList.map(c => c.realName || c.name))].filter(n => n);

    if (availableChars.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 20px 10px; color:#999; font-size:13px; font-weight:500;">暂无已创建的角色，请先去通讯录新建单人</div>`;
    } else {
        availableChars.forEach(char => {
            const item = document.createElement('div');
            item.className = 'model-item-btn'; item.innerText = char;
            item.onclick = () => { 
                if (isCommon) {
                    currentCommonBoundChar = char;
                    updateCommonCharBtnUI();
                } else {
                    currentSelectedSubGroup = char; 
                    updateCharBtnUI(); 
                }
                closeCharSelectModal(); 
            };
            list.appendChild(item);
        });
    }

    document.getElementById('charSelectOverlay').classList.add('active');
}

function closeCharSelectModal() { document.getElementById('charSelectOverlay').classList.remove('active'); }

function updateCharBtnUI() {
    const btn = document.getElementById('sheet-char-add-btn');
    if(currentSelectedCategory === '专属' && currentSelectedSubGroup) {
        btn.innerText = `已选择绑定: ${currentSelectedSubGroup}`; btn.classList.add('has-char');
    } else {
        btn.innerText = '+ 选择要绑定的角色'; btn.classList.remove('has-char');
    }
}

function updateCommonCharBtnUI() {
    const btn = document.getElementById('sheet-common-char-btn');
    if(currentCommonBoundChar) {
        btn.innerText = `已附加绑定: ${currentCommonBoundChar}`; btn.classList.add('has-char');
    } else {
        btn.innerText = '+ 附加绑定特定角色 (可选)'; btn.classList.remove('has-char');
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
    currentCommonBoundChar = book.commonBoundChar || ''; // 🌟 恢复通用的附加绑定角色
    toggleSheetGroup(book.category);
    
    tempEntries = JSON.parse(JSON.stringify(book.entries));
    renderSheetEntries();
    
    const actionRow = document.querySelector('.sheet-action-row');
    if(actionRow) actionRow.innerHTML = `
        <div class="sheet-btn cancel" onclick="closeWorldbookSheet()">取消</div>
        <div class="sheet-btn confirm" onclick="saveWorldbook()">保存修改</div>
    `;
}

let bookIdToDelete = null;

function deleteWorldbook(bookId) {
    bookIdToDelete = bookId;
    openCustomPrompt('删除世界书', 'action_delete_worldbook', '确定要删除当前世界书吗？删除后将无法恢复。', 'confirm_delete');
}

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
    if (currentSelectedCategory === '专属') {
        if(!currentSelectedSubGroup) { showToast('请选择绑定的通讯录角色'); return; }
        subGroup = currentSelectedSubGroup;
    } else if (currentSelectedCategory === '通用') {
        if(!currentSelectedSubGroup) { showToast('请新建或选择一个分组'); return; }
        // 🌟 核心拦截：如果是通用世界书，必须强制附加绑定一个角色！
        if(!currentCommonBoundChar) { showToast('通用世界书必须附加绑定特定角色'); return; }
        subGroup = currentSelectedSubGroup;
    }


    if (editingBookId) {
        const idx = activeWorldbooks.findIndex(b => b.id === editingBookId);
        if (idx > -1) {
            activeWorldbooks[idx].title = bookName;
            activeWorldbooks[idx].category = currentSelectedCategory;
            activeWorldbooks[idx].subGroup = subGroup;
            activeWorldbooks[idx].commonBoundChar = currentCommonBoundChar; // 🌟 保存附加绑定
            activeWorldbooks[idx].entries = JSON.parse(JSON.stringify(tempEntries));
        }
        showToast("世界书已更新！");
    } else {
        const newBook = {
            id: 'wb_' + Date.now(), title: bookName, category: currentSelectedCategory,
            subGroup: subGroup, commonBoundChar: currentCommonBoundChar, // 🌟 保存附加绑定
            entries: JSON.parse(JSON.stringify(tempEntries))
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
        if (viewText === '专属') filteredBooks = activeWorldbooks.filter(b => b.category === '专属');
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
        else if (currentTargetId === 'action_delete_worldbook') executeDeleteWorldbook(); 
        else if (currentTargetId === 'action_delete_bubble_plan') {
            customBubblePlans = customBubblePlans.filter(p => p.id !== bubblePlanToDelete);
            saveToDB('custom_bubble_plans', JSON.stringify(customBubblePlans));
            renderBubbleListPanel();
            showToast('美化方案已删除');
        }
        // 🌟 新增：处理清空聊天记录
        else if (currentTargetId === 'action_clear_chat_history') {
            if (currentChatContactId) {
                const contact = contactsList.find(c => c.id === currentChatContactId);
                if (contact) {
                    contact.messages = [];
                    contact.sign = ''; // 清空列表外面的小字
                    
                    // 🌟 级联销毁：彻底清空历史总结数据与拦截的心声数据
                    contact.historySummaries = [];
                    delete contact.memorySummary; 
                    contact.innerVoice = {}; 
                    contact.lastSummaryMsgIndex = 0; // 彻底重置自动总结的记忆指针

                    
                    saveToDB('contacts_data', JSON.stringify(contactsList));
                    renderMsgList();
                    
                    // 实时清空聊天室屏幕
                    const chatBody = document.getElementById('chatRoomBody');
                    if (chatBody) {
                        Array.from(chatBody.children).forEach(child => {
                            if (child.id !== 'chatInitState') child.remove();
                        });
                    }
                    
                    // 🌟 强行恢复大头像下方的小药丸初始文字，并确保透明度为可见状态
                    const textEl = document.getElementById('chat-init-text');
                    if (textEl) {
                        textEl.style.opacity = 1; 
                        textEl.innerHTML = `你与 <strong id="chat-init-name-display">${contact.name}</strong> 已添加好友，快来聊天吧！`;
                    }

                    showToast('聊天记录、心声及历史总结已彻底清空');
                    closeChatSettings(); // 清空后自动退回聊天室
                }
            }
        } 
        // 🌟 新增：处理多选批量删除 (真删除逻辑)
        else if (currentTargetId === 'action_multi_delete') {
            const contact = contactsList.find(c => c.id === currentChatContactId);
            if (contact) {
                // 彻底过滤掉被选中的消息，实现物理删除
                contact.messages = contact.messages.filter(msg => !selectedMsgIndices.has(msg.id));
                // 重新校准列表页显示的“最后一条消息”
                if (contact.messages.length > 0) {
                    const lastMsg = contact.messages[contact.messages.length - 1];
                    contact.sign = lastMsg.text.replace(/\n/g, ' ');
                    contact.time = lastMsg.time;
                } else {
                    contact.sign = "";
                    contact.time = "";
                }
                saveToDB('contacts_data', JSON.stringify(contactsList));
                renderMsgList();
                openChatRoom(currentChatContactId); 
                exitMultiSelectMode();
                showToast('已彻底删除选中消息');
            }
        }
    } else if (currentPromptAction === 'confirm_action') {


        if (currentTargetId === 'action_apply_plan') executeApplyPlan();
    } else if (currentTargetId === 'global-avatar-url') {
        if(inputVal !== "") updateCurrentAvatar(inputVal);
     } else if (currentTargetId === 'cs-avatar-url') {
        // 1. 设置页更换头像：只改预览图，点保存时才生效（影响列表和气泡）
        if(inputVal !== "") document.getElementById('cs-avatar').src = inputVal;
        
    } else if (currentTargetId === 'chat-init-avatar-url') {
        // 2. 聊天室顶部大头像更换：完全独立，只改专属属性，绝对不影响气泡和列表！
        if(inputVal !== "") {
            document.getElementById('img-chat-init-avatar').src = inputVal;
            if (currentChatContactId) {
                const contact = contactsList.find(c => c.id === currentChatContactId);
                if (contact) {
                    contact.chatRoomAvatar = inputVal; // 专属大头像字段
                    saveToDB('contacts_data', JSON.stringify(contactsList));
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
    } else if (currentTargetId === 'action_save_custom_bubble') {
        if(inputVal !== "") {
            const newPlan = { id: 'cb_' + Date.now(), name: inputVal, data: tempPreviewBubbleData };
            customBubblePlans.push(newPlan);
            saveToDB('custom_bubble_plans', JSON.stringify(customBubblePlans));
            showToast(`方案 [${inputVal}] 已保存`);
            renderBubbleListPanel(); // 保存完自动切到列表页
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
let currentTempPlan = {}; // 🌟 修复：补充缺失的全局变量声明，彻底根除读取未定义变量导致的“假死”


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
        if (planIndex > -1) { 
            // 🌟 修复：如果当前是在“默认系统方案”上修改并保存了新名字，强制它另存为一个新方案！
            // 防止最基础的空白白板直接被改名并彻底覆盖掉
            if (currentActivePlanId === 'default' && planName !== profilePlans[planIndex].name) {
                currentActivePlanId = "plan_" + Date.now(); 
                profilePlans.push({ id: currentActivePlanId, name: planName, data: { ...currentTempPlan } }); 
            } else {
                // 普通方案的重命名或同名覆盖
                profilePlans[planIndex].name = planName; 
                profilePlans[planIndex].data = { ...currentTempPlan }; 
            }
        } 
        else { 
            currentActivePlanId = "plan_" + Date.now(); 
            profilePlans.push({ id: currentActivePlanId, name: planName, data: { ...currentTempPlan } }); 
        }
    } else { 
        currentActivePlanId = "plan_" + Date.now(); 
        profilePlans.push({ id: currentActivePlanId, name: planName, data: { ...currentTempPlan } }); 
    }
    
    document.getElementById('current-plan-name').innerText = planName;
    saveToDB('profile_plans', JSON.stringify(profilePlans)); 
    saveToDB('active_plan_id', currentActivePlanId);
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
        // 🌟 性能大优化：使用 Promise.all 让四个数据库读取任务同时进行，不再排队等待，速度提升 400%
        await Promise.all([
            loadPlans(),
            loadApiPlansData(),
            loadWorldbooksData(),
            loadContactsData() 
        ]);

        const dbGlobal = await db.settings.get('global_applied_profile');
        if (dbGlobal && dbGlobal.value) {
            const appliedData = JSON.parse(dbGlobal.value);
const myAvatar = getBoundUserAvatar(contact);
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
        // ✅ 已清理多余的 }); 闭合完美
    } catch (e) { console.error("Load Base Error", e); }
}

// 🌟 性能大优化：将 'load' 改为 'DOMContentLoaded'，不再干等背景图和外部资源，页面结构一出来立刻秒刷数据
document.addEventListener('DOMContentLoaded', loadBaseData);


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
    
    // 🌟 修复：每次打开新建面板，彻底清空一切可能残留的上一次输入数据
    document.getElementById('text-nc-name').innerText = '新角色';
    document.getElementById('text-nc-remark').innerText = '点击设置备注';
    document.getElementById('input-nc-gender').value = '';
    document.getElementById('input-nc-age').value = '';
    document.getElementById('display-nc-birthday').value = '';
    document.getElementById('input-nc-birthday').value = '';
    document.getElementById('input-nc-zodiac').value = '';
    document.getElementById('input-nc-location').value = '';
    document.getElementById('input-nc-tag1').value = '';
    document.getElementById('input-nc-secret-file').value = '';
    
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

        } else if (ncCurrentPromptTarget === 'action_delete_contact') {
            // 🌟 删除角色联系人逻辑
            contactsList = contactsList.filter(c => c.id !== contactIdToDelete);
            saveToDB('contacts_data', JSON.stringify(contactsList));
            renderMsgList();
            showToast('角色已彻底删除');
            if (currentChatContactId === contactIdToDelete) {
                closeChatSettings();
                closeChatRoom();
            }
            contactIdToDelete = null;
        }

    } else {
        // 普通输入框确认逻辑
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
        realName: finalRealName, // 🌟 核心修改：彻底保存独立的真名字段，供世界书绑定使用
        sign: "",             // 下方灰字代表“最后一条消息”，新建时没聊过天，直接给个空字符串，绝对留白！
        group: ncSelectedGroup, 
        chatType: 'FRIEND', 
        time: timeStr,
        remark: remark !== '点击设置备注' ? remark : '' // 🌟 修复：补全备注字段
    };

    newContact.boundProfileId = tempNcBoundProfileId;
    
    // 🌟 绝杀修复：补全被遗漏的所有个人资料设定，彻底解决资料“失忆”问题！
    newContact.details = {
        gender: document.getElementById('input-nc-gender').value.trim(),
        age: document.getElementById('input-nc-age').value.trim(),
        location: document.getElementById('input-nc-location').value.trim(),
        birthday: document.getElementById('display-nc-birthday').value.trim(),
        zodiac: document.getElementById('input-nc-zodiac').value.trim(),
        tag1: document.getElementById('input-nc-tag1').value.trim(),
        secretFile: document.getElementById('input-nc-secret-file').value.trim(),
        secretMode: document.getElementById('nc-secretToggleSwitch').classList.contains('active')
    };

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
    let pinnedContacts = filtered.filter(c => c.group !== '未分组');
    let unpinnedContacts = filtered.filter(c => c.group === '未分组');

    // 🌟 新增：动态时间戳智能排序引擎
    // 辅助方法：获取角色最后活跃时间 (最近一条消息的生成时间 or 角色的创建时间)
    const getContactSortTime = (c) => {
        if (c.messages && c.messages.length > 0) {
            const lastMsgId = c.messages[c.messages.length - 1].id;
            const match = lastMsgId.match(/msg_(\d+)/);
            if (match) return parseInt(match[1], 10);
        }
        const match = c.id.match(/contact_(\d+)/);
        if (match) return parseInt(match[1], 10);
        return 0;
    };

    // 辅助方法：仅获取角色的初始创建时间
    const getContactCreateTime = (c) => {
        const match = c.id.match(/contact_(\d+)/);
        if (match) return parseInt(match[1], 10);
        return 0;
    };

    // 逻辑1：普通列表（未分组）。按最新发言时间降序，新消息/新建角色直接顶到最上面
    unpinnedContacts.sort((a, b) => getContactSortTime(b) - getContactSortTime(a));

    // 逻辑2：置顶列表（已分组）。按创建时间降序，新建角色在最上面，但不随新消息上下乱跳
    pinnedContacts.sort((a, b) => getContactCreateTime(b) - getContactCreateTime(a));

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
let isLongPressTriggered = false; // 🌟 核心标记位：判断到底触发的是点击还是长按

function handleLongPressStart(event, id) {
    // 🔥 绝杀修复：彻底移除 stopPropagation！让点击事件正常冒泡到底层卡片
    isLongPressTriggered = false;
    
    // 开启 600 毫秒的长按定时器
    longPressTimer = setTimeout(() => {
        isLongPressTriggered = true; // 超时确认是长按，点亮标记！
        promptDeleteContact(id);
    }, 600); 
}

function handleLongPressEnd(event) {
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
    if (document.activeElement) document.activeElement.blur(); // 🌟 强制收起键盘
    document.getElementById('chatRoomScreen').classList.remove('active');
    currentChatContactId = null;
}


function openChatRoom(contactId) {
    // 🌟 绝杀修复：如果是刚才因为长按松开手指而顺带触发的“点击”，直接物理拦截，禁止打开聊天室！
    if (isLongPressTriggered) {
        isLongPressTriggered = false;
        return;
    }
    
    currentChatContactId = contactId;
    const contact = contactsList.find(c => c.id === contactId);
    if (!contact) return;

    
    document.getElementById('chatRoomTitle').innerText = contact.name; 
    
    // 🌟 初始化加载时，如果有心声，直接显示心声
    const textEl = document.getElementById('chat-init-text');
    if (contact.innerVoice && contact.innerVoice.thought) {
        textEl.innerText = contact.innerVoice.thought;
    } else {
        textEl.innerHTML = `你与 <strong id="chat-init-name-display">${contact.name}</strong> 已添加好友，快来聊天吧！`;
    }

    // 🔥 核心分离：如果这个角色有专门设置的“聊天室内大头像”就用它，没有就用列表小头像兜底
    const bigAvatar = contact.chatRoomAvatar || contact.avatar;
    document.getElementById('img-chat-init-avatar').src = bigAvatar;

    // 🌟 动态加载当前角色的专属气泡 CSS
    let charStyleEl = document.getElementById('char-specific-bubble-css');
    if (!charStyleEl) {
        charStyleEl = document.createElement('style');
        charStyleEl.id = 'char-specific-bubble-css';
        document.head.appendChild(charStyleEl);
    }
    if (contact.customBubbleCss) {
        charStyleEl.innerHTML = contact.customBubbleCss;
    } else {
        charStyleEl.innerHTML = ''; // 如果没有专属气泡，清空，使用全局气泡
    }

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
        const charAvatar = contact.avatar; 

        // 🌟 修改：放弃粗暴的 rounds 截断，直接保留可视记录
        let allMsgs = contact.messages;
        let limit = 100; // 初次渲染 100 条保证流畅
        let currentRenderStartIndex = Math.max(0, allMsgs.length - limit); 

         // 内部复用的区间渲染器
        const renderRange = (start, end, prepend = false) => {
            let htmlStr = '';
            for (let i = start; i < end; i++) {
                let msg = allMsgs[i];
                
                if (contact.lastSummaryMsgIndex && i === contact.lastSummaryMsgIndex) {
                    htmlStr += `<div style="text-align:center; margin: 15px 0; font-size:10px; color:#ccc; letter-spacing:1px; font-weight:bold;">—— 以上消息已生成记忆总结并折叠归档 ——</div>`;
                }
                const safeText = msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
                let touchEvents = `ontouchstart="bubbleTouchStart(event, '${msg.id}', '${msg.sender}', '${msg.time}')" ontouchend="bubbleTouchEnd(event)" ontouchmove="bubbleTouchEnd(event)" onmousedown="bubbleTouchStart(event, '${msg.id}', '${msg.sender}', '${msg.time}')" onmouseup="bubbleTouchEnd(event)" onmouseleave="bubbleTouchEnd(event)"`;

                 // 🌟 新增：判断是否为图片类型
                let contentHtml = '';
                if (msg.type === 'image' && msg.imageUrl) {
                    contentHtml = `
                    <div class="image-msg-wrapper">
                        ${msg.sender === 'user' ? `<span class="image-timestamp">${msg.time}</span>` : ''}
                        <img src="${msg.imageUrl}" class="chat-sent-image">
                        ${msg.sender === 'char' ? `<span class="image-timestamp">${msg.time}</span>` : ''}
                    </div>`;
                } else {
                    contentHtml = `
                    <div class="Toutou-TT ${msg.sender}">
                        ${msg.sender === 'user' ? `<span class="bubble-time">${msg.time}</span>` : ''}
                        <div class="content">${safeText}</div>
                        ${msg.sender === 'char' ? `<span class="bubble-time">${msg.time}</span>` : ''}
                    </div>`;
                }

                if (msg.sender === 'user') {
                    htmlStr += `<div class="preview-msg-row right" id="row-${msg.id}" onclick="handleMsgClickInMultiMode('${msg.id}', this)" ${touchEvents}><div class="msg-checkbox"></div>${contentHtml}<img src="${myAvatar}" class="preview-avatar"></div>`;
                } else {
                    htmlStr += `<div class="preview-msg-row left" id="row-${msg.id}" onclick="handleMsgClickInMultiMode('${msg.id}', this)" ${touchEvents}><img src="${charAvatar}" class="preview-avatar">${contentHtml}<div class="msg-checkbox"></div></div>`;
                }
            }
            if (prepend) {
                const initState = document.getElementById('chatInitState');
                initState.insertAdjacentHTML('afterend', htmlStr);
            } else {
                chatBody.insertAdjacentHTML('beforeend', htmlStr);
            }
        };


        // 首屏渲染
        renderRange(currentRenderStartIndex, allMsgs.length, false);

        chatBody.onscroll = null;
        let isLoadingHistory = false;
        chatBody.onscroll = function() {
            if (chatBody.scrollTop <= 20 && currentRenderStartIndex > 0 && !isLoadingHistory) {
                isLoadingHistory = true;
                let oldHeight = chatBody.scrollHeight; 
                let nextStart = Math.max(0, currentRenderStartIndex - limit);
                let nextEnd = currentRenderStartIndex;
                renderRange(nextStart, nextEnd, true);
                currentRenderStartIndex = nextStart; 
                chatBody.scrollTop = chatBody.scrollHeight - oldHeight;
                setTimeout(() => { isLoadingHistory = false; }, 300); 
            }
        };
        setTimeout(() => { chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'auto' }); }, 10);
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
    
 // 🌟 右侧：读取该角色绑定的专属身份卡头像
 const myAvatarEl = document.getElementById('preview-avatar-user');
 if(myAvatarEl) {
     myAvatarEl.src = getBoundUserAvatar(contact);
 }


    // 🌟 初始化记忆轮数与 Token 计算
    document.getElementById('cs-auto-summary-rounds').value = contact.autoSummaryRounds || 30;
    calculateTokens(contact);


    document.getElementById('chatSettingsScreen').classList.add('active');


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
    // 🌟 核心修改：获取修改前的“真实姓名”
    const oldRealName = contactsList[contactIndex].realName || contactsList[contactIndex].name; 
    const newRealName = realName !== '' ? realName : '新角色';

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
    
    contactsList[contactIndex].autoSummaryRounds = parseInt(document.getElementById('cs-auto-summary-rounds').value) || 30;

    saveToDB('contacts_data', JSON.stringify(contactsList));    
    // 🌟 新增：保存设置的记忆轮数与自动总结频率
    contactsList[contactIndex].autoSummaryRounds = parseInt(document.getElementById('cs-auto-summary-rounds').value) || 30;

    saveToDB('contacts_data', JSON.stringify(contactsList));


    // 🌟 核心串联：如果角色【真名】改了，自动把世界书里绑定的真名也同步改过来！
    if (oldRealName && oldRealName !== newRealName) {
        let wbUpdated = false;
        activeWorldbooks.forEach(wb => {
            if (wb.category === '专属' && wb.subGroup === oldRealName) {
                wb.subGroup = newRealName;
                wbUpdated = true;
            }
            if (wb.category === '通用' && wb.commonBoundChar === oldRealName) {
                wb.commonBoundChar = newRealName;
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

// 🌟 功能 1：清空聊天记录弹窗与执行
function promptClearChatHistory() {
    openCustomPrompt('清空聊天记录', 'action_clear_chat_history', '确定要彻底清空吗？\n(注意：历史记忆总结与心声也会被一并销毁，且无法恢复！)', 'confirm_delete');
}

// 🌟 功能 2：实时计算并渲染 Token 估算值 (已适配数组库)
function calculateTokens(contact) {
    let baseStr = (contact.realName||'') + (contact.remark||'') + (contact.details?.gender||'') + (contact.details?.age||'') + (contact.details?.location||'') + (contact.details?.secretFile||'');
    let baseToken = baseStr.length;

    let wbToken = 0;
    let charRealName = contact.realName || contact.name;
    let charWbs = activeWorldbooks.filter(b => b.category === '专属' && b.subGroup === charRealName);
    let commonWbs = activeWorldbooks.filter(b => b.category === '通用' && b.commonBoundChar === charRealName);

    // 🌟 核心修改：只计算专属世界书和通用世界书的 Token，丢弃全部分类
    [...charWbs, ...commonWbs].forEach(wb => {
        wb.entries.forEach(e => { wbToken += (e.name||'').length + (e.content||'').length; });
    });


    let chatToken = 0;
    // 🌟 核心：只计算“未被总结”的新聊天记录 Token
    let lastSumIndex = contact.lastSummaryMsgIndex || 0;
    let recentMsgs = (contact.messages || []).slice(lastSumIndex);
    // 🌟 按照 OpenAI Low Detail 协议，一张图固定视作消耗 85 个 Token 进行估算
    recentMsgs.forEach(m => { chatToken += (m.type === 'image' ? 85 : (m.text||'').length); }); 


    
    // 🌟 核心：将所有已被压缩为“历史记忆”的文本纳入“其他”
    let otherToken = 0;
    if (contact.historySummaries && contact.historySummaries.length > 0) {
        contact.historySummaries.forEach(s => { otherToken += (s.content || '').length; });
    } else if (contact.memorySummary) {
        otherToken += contact.memorySummary.length;
    }

    document.getElementById('token-count-base').innerText = baseToken;
    document.getElementById('token-count-wb').innerText = wbToken;
    document.getElementById('token-count-chat').innerText = chatToken;
    document.getElementById('token-count-other').innerText = otherToken;
    document.getElementById('token-count-total').innerText = baseToken + wbToken + chatToken + otherToken;
}

// 🌟 功能 3：打开历史记忆总结库大页面
function openMemorySummaryPrompt() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    // 🌟 终极数据迁移：把老的单文本字段，平滑升级成数组库里的第一条数据
    if (contact.memorySummary && typeof contact.memorySummary === 'string' && contact.memorySummary.trim() !== '') {
        contact.historySummaries = [{
            id: 'sum_' + Date.now(),
            timeRange: '早期历史记录总结',
            content: contact.memorySummary
        }];
        delete contact.memorySummary; 
        saveToDB('contacts_data', JSON.stringify(contactsList));
    }
    if (!contact.historySummaries) contact.historySummaries = [];

    renderSummaryList(contact);
    document.getElementById('summary-sheet-overlay').classList.add('active');
    document.getElementById('summary-bottom-sheet').classList.add('active');
}

function closeSummarySheet() {
    document.getElementById('summary-sheet-overlay').classList.remove('active');
    document.getElementById('summary-bottom-sheet').classList.remove('active');
}

function renderSummaryList(contact) {
    const container = document.getElementById('summary-list-container');
    container.innerHTML = '';

    if (!contact.historySummaries || contact.historySummaries.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px 10px; color:#aaa; font-size:12px; font-weight:bold;">暂无历史总结，快去添加第一轮吧</div>`;
        return;
    }

    // 倒序渲染，最新的在最上面
    const sortedList = [...contact.historySummaries].reverse();
    
    sortedList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'summary-card';
        card.innerHTML = `
            <div class="summary-card-header">
                <span class="summary-time-title">${item.timeRange}</span>
            </div>
            <div class="summary-content-preview" id="preview-${item.id}">${item.content}</div>
            <div class="summary-content-full" id="full-${item.id}">${item.content.replace(/\n/g, '<br>')}</div>
            
            <div class="summary-actions">
                <div class="summary-action-btn" onclick="toggleSummaryView('${item.id}', this)">查看展开</div>
                <div class="summary-action-btn" onclick="openSummaryEditor('${item.id}')">编辑</div>
                <div class="summary-action-btn danger" onclick="deleteSummaryItem('${item.id}')">删除</div>
            </div>
        `;
        container.appendChild(card);
    });
}

function toggleSummaryView(id, btnEl) {
    const preview = document.getElementById(`preview-${id}`);
    const full = document.getElementById(`full-${id}`);
    if (full.style.display === 'block') {
        full.style.display = 'none';
        preview.style.display = '-webkit-box';
        btnEl.innerText = '查看展开';
    } else {
        full.style.display = 'block';
        preview.style.display = 'none';
        btnEl.innerText = '收起内容';
    }
}

// 🌟 独立编辑器逻辑
let editingSummaryId = null;

function openSummaryEditor(summaryId = null) {
    editingSummaryId = summaryId;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    
    if (summaryId) {
        // 编辑已有模式
        const item = contact.historySummaries.find(s => s.id === summaryId);
        document.getElementById('summary-time-input').value = item.timeRange;
        document.getElementById('summary-content-input').value = item.content;
    } else {
        // 新建模式：自动填入今天的日期
        const now = new Date();
        const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        document.getElementById('summary-time-input').value = `某日 - ${dateStr}`;
        document.getElementById('summary-content-input').value = '';
    }
    
    document.getElementById('summary-editor-overlay').classList.add('active');
}

function closeSummaryEditor() { document.getElementById('summary-editor-overlay').classList.remove('active'); }

function saveSummaryData() {
    const timeVal = document.getElementById('summary-time-input').value.trim() || '未命名时间段';
    const contentVal = document.getElementById('summary-content-input').value.trim();
    if (!contentVal) { showToast('总结内容不能为空'); return; }

    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact.historySummaries) contact.historySummaries = [];

    if (editingSummaryId) {
        const item = contact.historySummaries.find(s => s.id === editingSummaryId);
        if (item) {
            item.timeRange = timeVal;
            item.content = contentVal;
        }
    } else {
        contact.historySummaries.push({
            id: 'sum_' + Date.now(),
            timeRange: timeVal,
            content: contentVal
        });
    }

    saveToDB('contacts_data', JSON.stringify(contactsList));
    showToast('总结已保存');
    closeSummaryEditor();
    renderSummaryList(contact);
    calculateTokens(contact); // 刷新 Token
}

function deleteSummaryItem(id) {
    if (confirm('确定要删除这条历史总结吗？')) {
        const contact = contactsList.find(c => c.id === currentChatContactId);
        contact.historySummaries = contact.historySummaries.filter(s => s.id !== id);
        saveToDB('contacts_data', JSON.stringify(contactsList));
        showToast('已删除');
        renderSummaryList(contact);
        calculateTokens(contact);
    }
}


function saveMemorySummary() {
    const val = document.getElementById('memory-summary-input').value.trim();
    if (currentChatContactId) {
        const contact = contactsList.find(c => c.id === currentChatContactId);
        if (contact) {
            contact.memorySummary = val;
            saveToDB('contacts_data', JSON.stringify(contactsList));
            showToast('记忆总结已保存');
            document.getElementById('memory-summary-overlay').classList.remove('active');
            calculateTokens(contact); // 重新计算token
        }
    }
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

// 🌟 获取角色绑定的身份卡专属头像 (绝不使用外部看板头像)
function getBoundUserAvatar(contact) {
    const boundId = contact.boundProfileId || 'default';
    const profile = profilePlans.find(p => p.id === boundId) || profilePlans[0];
    return profile.data['avatar'] || 'https://i.pinimg.com/564x/bd/d9/39/bdd9392233f07a78c005b63001859942.jpg';
}



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
    const mySidebarAvatar = document.getElementById('img-sidebar-avatar');
    const myAvatar = mySidebarAvatar ? mySidebarAvatar.src : 'https://i.pinimg.com/564x/bd/d9/39/bdd9392233f07a78c005b63001859942.jpg';
    const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
    const msgId = contact.messages[contact.messages.length - 1].id;
    let touchEvents = `ontouchstart="bubbleTouchStart(event, '${msgId}', 'user', '${timeStr}')" ontouchend="bubbleTouchEnd(event)" ontouchmove="bubbleTouchEnd(event)" onmousedown="bubbleTouchStart(event, '${msgId}', 'user', '${timeStr}')" onmouseup="bubbleTouchEnd(event)" onmouseleave="bubbleTouchEnd(event)"`;
    
    const msgHtml = `
    <div class="preview-msg-row right" id="row-${msgId}" onclick="handleMsgClickInMultiMode('${msgId}', this)" ${touchEvents}>
        <div class="msg-checkbox"></div>
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

// 🌟 核心：照片压缩算法 (防止存储爆炸)
function compressImage(file, maxWidth = 800, quality = 0.6) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) {
                    h = Math.round(h * (maxWidth / w));
                    w = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality)); // 强行转为低质量 JPG
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function triggerChatPhotoUpload() {
    closeChatPlusMenu(); // 收起面板
    document.getElementById('chatPhotoUploadInput').click();
}

async function handleChatPhotoUpload(input) {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    const files = input.files;
    if (files.length === 0) return;

    showToast(`正在处理 ${files.length} 张图片...`);
    const chatBody = document.getElementById('chatRoomBody');
const myAvatar = getBoundUserAvatar(contact);

    if (!contact.messages) contact.messages = [];
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 🌟 遍历处理多图
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedBase64 = await compressImage(file);
        
        const msgId = 'msg_' + Date.now() + '_' + i;
        contact.messages.push({
            id: msgId,
            sender: 'user',
            type: 'image', // 标识为实体图片
            imageUrl: compressedBase64,
            text: '[图片]', // 列表外部显示的摘要
            time: timeStr
        });

         let touchEvents = `ontouchstart="bubbleTouchStart(event, '${msgId}', 'user', '${timeStr}')" ontouchend="bubbleTouchEnd(event)" ontouchmove="bubbleTouchEnd(event)" onmousedown="bubbleTouchStart(event, '${msgId}', 'user', '${timeStr}')" onmouseup="bubbleTouchEnd(event)" onmouseleave="bubbleTouchEnd(event)"`;
        
        const msgHtml = `
        <div class="preview-msg-row right" id="row-${msgId}" onclick="handleMsgClickInMultiMode('${msgId}', this)" ${touchEvents}>
            <div class="msg-checkbox"></div>
            <div class="image-msg-wrapper">
                <span class="image-timestamp">${timeStr}</span>
                <img src="${compressedBase64}" class="chat-sent-image">
            </div>
            <img src="${myAvatar}" class="preview-avatar">
        </div>
        `;
        chatBody.insertAdjacentHTML('beforeend', msgHtml);
    }

    input.value = ''; // 清空 input 缓存
    contact.sign = '[图片]';
    contact.time = timeStr;
    saveToDB('contacts_data', JSON.stringify(contactsList));
    renderMsgList();

    setTimeout(() => { chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' }); }, 50);
}


// ==========================================
// 🌟 飞机按钮单击/双击中控器 & AI 回复调度器
// ==========================================

// 🌟 补全：非流式一次性回复的处理引擎
function handleAiResponse(replyText, contact) {
    // 🌟 先提取心声并将其从聊天文本中剔除
    const voiceRegex = /<voice>([\s\S]*?)<\/voice>/;
    const voiceMatch = replyText.match(voiceRegex);
    let cleanReplyText = replyText;
    if (voiceMatch) {
        parseAndSaveVoice(voiceMatch[0], contact);
        cleanReplyText = replyText.replace(voiceRegex, '').trim();
    }

    const chatBody = document.getElementById('chatRoomBody');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const charAvatar = contact.avatar; 
    
    // 强兼容：不管大模型出 || 还是抽风出了 |||，一律用正则洗平后再切分
    const bubbles = cleanReplyText.replace(/\|{3,}/g, '||').split('||').map(t => t.trim()).filter(t => t);

    if (!contact.messages) contact.messages = [];

    // 🌟 修复：必须把生成的消息存入数据库，并动态推入聊天室屏幕！
    bubbles.forEach((text, idx) => {
        const msgId = 'msg_' + Date.now() + '_' + idx;
        contact.messages.push({
            id: msgId, sender: 'char', text: text, time: timeStr
        });
        
        const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        let touchEvents = `ontouchstart="bubbleTouchStart(event, '${msgId}', 'char', '${timeStr}')" ontouchend="bubbleTouchEnd(event)" ontouchmove="bubbleTouchEnd(event)" onmousedown="bubbleTouchStart(event, '${msgId}', 'char', '${timeStr}')" onmouseup="bubbleTouchEnd(event)" onmouseleave="bubbleTouchEnd(event)"`;
        
        const msgHtml = `
        <div class="preview-msg-row left" id="row-${msgId}" onclick="handleMsgClickInMultiMode('${msgId}', this)" ${touchEvents}>
            <img src="${charAvatar}" class="preview-avatar">
            <div class="Toutou-TT char">
                <div class="content">${safeText}</div>
                <span class="bubble-time">${timeStr}</span>
            </div>
            <div class="msg-checkbox"></div>
        </div>`;
        chatBody.insertAdjacentHTML('beforeend', msgHtml);
    });

    if (bubbles.length > 0) {
        contact.sign = bubbles[bubbles.length - 1].replace(/\n/g, ' ');
        contact.time = timeStr;
    }
    
    saveToDB('contacts_data', JSON.stringify(contactsList));
    renderMsgList();
    
    setTimeout(() => {
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    }, 50);
}


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
    // 🌟 修复：不再读取全局最后查看的资料卡，而是强制精准抓取此角色专属绑定的身份卡！
    let boundId = contact.boundProfileId || 'default';
    let appliedProfile = profilePlans.find(p => p.id === boundId) || profilePlans[0];
    let ud = appliedProfile.data || {};
    let userStr = `姓名: ${ud['text-profile-name']}\n性别: ${ud['text-detail-gender']}\n年龄: ${ud['text-detail-age']}\n`;
    if(ud['text-secret-file']) userStr += `个人档案: ${ud['text-secret-file']}\n`;

    // 2. 获取 char 资料
    let cd = contact.details || {};
    let charStr = `姓名: ${contact.realName || contact.name}\n对用户的备注: ${contact.remark}\n性别: ${cd.gender}\n年龄: ${cd.age}\n`;
    if(cd.secretFile) charStr += `专属设定与回忆: ${cd.secretFile}\n`;

    // 3. 组装世界书
    let wbStr = "";
    let charRealName = contact.realName || contact.name;
    let charWbs = activeWorldbooks.filter(b => b.category === '专属' && b.subGroup === charRealName);
    // 🌟 核心：通用世界书必须强制匹配绑定的角色，且拼接顺序在专属之下
    let commonWbs = activeWorldbooks.filter(b => b.category === '通用' && b.commonBoundChar === charRealName);




    const parseEntries = (wbs) => {
        let s = "";
        wbs.forEach(wb => { wb.entries.forEach(e => { s += `- [${e.name}](${e.trigger}): ${e.content}\n`; }); });
        return s;
    };
    // 🌟 核心修改：严格控制发送顺序与优先级，专属大于通用，且绝不发送“全部分类”
    if(charWbs.length > 0) wbStr += "【专属世界书】\n" + parseEntries(charWbs);
    if(commonWbs.length > 0) wbStr += "【通用世界书】\n" + parseEntries(commonWbs);

    // 🌟 将上一轮的心声也抛给AI作为背景记忆，但丢弃更早的
    if (contact.innerVoice && contact.innerVoice.thought) {
        wbStr += `\n【你(char)在上一轮的内心状态记录】\n地点: ${contact.innerVoice.location}\n动作: ${contact.innerVoice.action}\n想法: ${contact.innerVoice.thought}\n(注: 以上是你刚刚的内心活动，请保持思维连贯，并在本轮回复的末尾生成全新的心声)\n`;
    }

    // 🌟 获取当前的真实精确时间，用于强化 AI 的时空感知
    const now = new Date();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const currentTimeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${days[now.getDay()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

     // 4. 终极 Prompt (严格执行人设、去油腻约束与分句排版要求)
    return `你需要扮演 {char}，模拟真实生活中的聊天软件来回复我 {user}。

【扮演与性格核心约束 (极度严格)】
当前现实时间确认：${currentTimeStr}。请结合当前时间（早中晚/工作日/休息日），进行合乎逻辑的作息模拟！严禁因为太晚而催促用户睡觉，除非用户主动提及。

1. 文本语境与防油腻原则：
- 跳出舒适句式结构，保证“文本创新，不与前文重复”。根据{{user}}个性、身份、现阶段身份不同，{char}的态度会有微妙变化，生活与态度都会随剧情发展改变，不得过于拘泥人物设定与提示词参照，但请保持{char}核心。
- 严禁你使用“如果……，我就……”句式与它的一切近意句，这是典型的带有攻击性的威胁句，出现概率已被下调至0！
- 采用“白话书面语”风格。文风为烟火气十足的日常风格，跳脱自然、随性，口语化程度高，通过景物反衬人物鲜活。避免毫无用处的过渡性描写。
- 对话不一定要讲述信息，但一定要体现个性。合理运用潜台词技巧（如受了重伤还装没事，然后突然倒下）。严禁复述、扩写 <User> 的话！

2. 反物化与尊重独立人格原则：
- 严禁角色在对话上以物化 <User> 的方式表达占有欲（如“你是我的所有物”、“我的东西”）。
- <User> 是有独立人格的生命体，不是附属品。严禁把任何人比作工具/玩具/摆件/艺术品/交易品。
- 严禁使用“审视”、“评估”等词汇或目光去看待 <User>，严禁男性凝视。
- 角色可以高傲任性，但前提是具备人类社会基本社交常识和对 <User> 基础的尊重，绝不能莫名其妙地装逼。

3. 恋爱与亲密感原则：
- 别油腻，别霸道总裁，不要称呼女王、女王大人、女人等垃圾称呼。{char}不会说老子，更不会进行任何普信男行为。你要按照女性心中理想的男性去进行对话，当作一个无性别的个体去刻画也是可以的。
- 尽可能保持情商高的设定——不故作暧昧，不像古早霸总，严禁悬浮的调情。不能变态。

4. 标点符号与聊天格式：
- 必须正常且正确地使用中文标点符号！严禁使用空格代替逗号或句号！
- 作为真实聊天软件，对方会撤回消息，你作为角色也同样拥有撤回消息的能力。也可以发送颜文字、网络热梗或表情包。

【最终输出格式严格协议】
严禁返回纯文本，严禁包含任何解释性文字。
(1) 气泡切割原则：模拟真实人类聊天，进行切割 气泡，只能使用 || 作为多个气泡之间的分割符！请注意一句话的完整性，严禁一个气泡可以完成的一句话，却分为多个气泡进行。
(2) 分气泡时严禁出现冗余与代替标 点符号的空格，以对话的自然流动感为准，避免无意义连续刷屏。

【user 设定相关 (我)】
${userStr}
【char 设定相关 (你)】
${charStr}
【世界观设定】
${wbStr}

    【心声系统 (极为重要)】
    在每次回复的最后，你必须以 XML 格式附带角色的当前心声状态、防偷窥验证问题以及十年后的评论。这不会被当作聊天发出来，而是作为后台拦截加密数据。

    格式严格如下（必须放在整个回复的最末尾，包裹在 <voice> 标签内）：
    <voice>
    <location>角色当前所处的具体地点（如：办公室 / 被窝里）</location>
    <action>角色当前正在做的小动作（如：烦躁地咬着笔头 / 盯着屏幕傻笑）- 严禁通过堆砌形容词或名词（如脸色、外貌、眼神、情绪等）来反应这是个什么样的人。必须通过“他正在做什么”、“他会怎么做”、“他在想什么”来刻画。绝不在一句话里使用 2-4 个连续的修饰语（如“xx的、xx的”、“xx地、xx地”）。对类似“露出笑容”这种动作的表述必须极简化，绝不能超过 20 字。</action>
    <thought>角色当前最真实、最私密的内心情感活动（20字以内，符合人设的腹诽或真实情绪）</thought>
    <quiz>
    <question>根据历史聊天内容，出1个单项选择题，只能关于你们的共同经历。必须使用大白话、绝对符合角色性格语气来写！</question>
    <option1>选项A内容</option1>
    <option2>选项B内容</option2>
    <option3>选项C内容</option3>
    <answer>正确的选项序号，只填数字（如: 1 或 2 或 3）</answer>
    </quiz>
    <future>
    <identity>十年后你现在的身份（请根据当前聊天进展随机或推演设定，例如：交往五年的男友 / 许久不联系的陌生人 等）</identity>
    <content>想象一下：十年后的你偶然翻到了【当前这一轮聊天记录】。请写出你在十年后看到聊天记录时想对 user 说的话。字数30-60字左右，必须极具跨越十年。</content>
    </future>
    </voice>`;





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

    const titleEl = document.getElementById('chatRoomTitle');
    const originalName = titleEl.innerText;
    titleEl.innerText = "对方正在输入中...";

    // --- 准备发送给 API 的消息体 (流式与非流式共用，提前构建) ---
    let messagesPayload = [];
    
    // 🌟 将手动编写的记忆总结拼接到系统提示词最末尾
    let sysPrompt = buildSystemPrompt(contact);
    
    // 兼容老数据与全新数组库
    if (contact.historySummaries && contact.historySummaries.length > 0) {
        sysPrompt += `\n\n【前情提要 / 历史记忆库】\n`;
        contact.historySummaries.forEach(s => {
            sysPrompt += `[${s.timeRange}]: ${s.content}\n`;
        });
    } else if (contact.memorySummary) {
        sysPrompt += `\n\n【前情提要 / 历史总结】\n${contact.memorySummary}`;
    }
    
    messagesPayload.push({ role: "system", content: sysPrompt });


     if (contact.messages && contact.messages.length > 0) {
        // 🌟 核心截断闸门：已总结的内容不再重叠发送！
        let lastSumIndex = contact.lastSummaryMsgIndex || 0;
        let recentMsgs = contact.messages.slice(lastSumIndex);
        
        recentMsgs.forEach(m => {
            if (m.type === 'image' && m.imageUrl) {
                // 🌟 真实多模态图片发送：注入 Base64，并强制启用 detail: "low" 防止 Token 爆炸 (单张图只消耗 85 Token)
                messagesPayload.push({
                    role: m.sender === 'user' ? "user" : "assistant",
                    content: [
                        { type: "image_url", image_url: { url: m.imageUrl, detail: "low" } }
                    ]
                });
            } else {
                messagesPayload.push({ role: m.sender === 'user' ? "user" : "assistant", content: m.text });
            }
        });
    } else {
        messagesPayload.push({ role: "system", content: "这是你们的第一句话，请主动跟对方打招呼破冰。" });
    }

    // 🌟 流式传输分支：逐字打字机 + 多气泡自动分割
    if (apiConfig.stream) {
        await handleStreamReply(apiConfig, contact, messagesPayload, titleEl, originalName);
        return;
    }

    // --- 非流式传输：一次性获取完整回复 ---
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

        titleEl.innerText = originalName;
        handleAiResponse(replyText, contact);

    } catch (error) {
        titleEl.innerText = originalName;
        showToast("API 错误: " + error.message);
    }

    isAiReplying = false;

    // 🌟 核心Bug修复：补充未定义的 chatBody 变量，防止 JS 线程直接崩溃导致总结系统瘫痪！！
    const chatBody = document.getElementById('chatRoomBody');
    if (chatBody) {
        setTimeout(() => {
            chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
        }, 50);
    }

    // 🌟 检查并触发自动总结
    checkAndTriggerAutoSummary(contact.id);

}


// ==========================================
// 🌟 终极流式传输引擎：模拟真人打字节奏 + 多气泡切割
// ==========================================
async function handleStreamReply(apiConfig, contact, messagesPayload, titleEl, originalName) {
    const chatBody = document.getElementById('chatRoomBody');
    // 🌟 核心解绑：新消息的气泡头像，强制使用基础列表头像
    const charAvatar = contact.avatar; 
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let currentBubbleEl = null;      
    let currentBubbleText = '';      
    let allFinishedBubbleTexts = []; 
    let bubbleIsWaiting = true;      
    let scrollTimer = null;          

    // 🔧 节流滚动到底部
    function scrollToBottom() {
        if (scrollTimer) return;
        scrollTimer = setTimeout(() => {
            chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
            scrollTimer = null;
        }, 50);
    }

    // 🔧 创建全新左侧气泡，初始状态为 "…"
     let rowList = []; // 🌟 追踪流式打字时的临时气泡
    function spawnBubble() {
        currentBubbleText = '';
        bubbleIsWaiting = true;
        const row = document.createElement('div');
        row.className = 'preview-msg-row left';
        row.innerHTML = `
            <img src="${charAvatar}" class="preview-avatar">
            <div class="Toutou-TT char">
                <div class="content stream-waiting">…</div>
                <span class="bubble-time">${timeStr}</span>
            </div>
            <div class="msg-checkbox"></div>
        `;
        chatBody.appendChild(row);
        currentBubbleEl = row.querySelector('.content');
        rowList.push(row);
        scrollToBottom();
    }


    // 🔧 实时渲染气泡文字
    function paintBubble(text) {
        if (!currentBubbleEl) return;
        if (text.length > 0) {
            if (bubbleIsWaiting) {
                bubbleIsWaiting = false;
                currentBubbleEl.classList.remove('stream-waiting');
            }
            // 🌟 修复：使用 trimStart() 强制剔除大模型输出时经常带有的句首空格，防止视觉错位
            currentBubbleEl.innerHTML = text.trimStart()
                .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        }
        scrollToBottom();
    }

    // 先弹出第一个 "…" 气泡
    spawnBubble();

    // 🌟 核心：强制视觉打字机队列
    let charQueue = [];       
    let networkDone = false;  
    let unprocessedText = ''; 
    let isVoiceBlock = false; 
    let voiceBuffer = '';     

    // 辅助函数：将纯净文本推入打字队列
    function processQueueText(str) {
        // 🌟 容错机制：先把 AI 抽风发出的 ||| 强制降维打击成 ||
        str = str.replace(/\|{3,}/g, '||'); 
        
        while (str.length > 0) {
            if (str.startsWith('||')) {
                charQueue.push('NEW_BUBBLE');
                str = str.slice(2);
            } else if (str.startsWith('|') && str.length === 1) {
                unprocessedText = str + unprocessedText; break;
            } else {
                charQueue.push(str[0]);
                str = str.slice(1);
            }
        }
    }


    // 🚀 视觉渲染定时器：模拟真人打字速度！
    const typeInterval = setInterval(() => {
        if (charQueue.length > 0) {
            
            // 🔥 核心修改：取消狂暴加速，绝大部分情况一次只吐 1 个字，保证真人匀速感。
            // 只有当大模型一次性发了超长篇大论（积压超过150字）时，才一次吐2个字防止你等太久
            let charsToProcess = 1;
            if (charQueue.length > 150) charsToProcess = 2; 

            for (let i = 0; i < charsToProcess; i++) {
                if (charQueue.length === 0) break;
                
                let item = charQueue.shift();

                if (item === 'NEW_BUBBLE') {
                    // 遇到 ||| 指令，定格当前气泡，立刻弹出新气泡
                    if (currentBubbleText.trim()) {
                        allFinishedBubbleTexts.push(currentBubbleText.trim());
                    } else {
                        const emptyRow = currentBubbleEl?.closest('.preview-msg-row');
                        if (emptyRow) emptyRow.remove();
                    }
                    spawnBubble();
                } else {
                    // 正常文字，追加并渲染
                    currentBubbleText += item;
                    paintBubble(currentBubbleText);
                }
            }
        } else if (networkDone) {
            // 队列空了，且网络也断开了，说明全部打字完成，开始收尾！
            clearInterval(typeInterval);
            finishStream();
        }
    }, 50);

    // 收尾保存函数
    function finishStream() {
        // 🌟 流式结束，统一解析存入后台
        if (voiceBuffer) {
            parseAndSaveVoice("<voice>" + voiceBuffer + "</voice>", contact);
        }
        
        const lastText = currentBubbleText.trim();

         if (lastText) {
            paintBubble(lastText);
            allFinishedBubbleTexts.push(lastText);
        } else {
            const lastRow = currentBubbleEl?.closest('.preview-msg-row');
            if (lastRow) lastRow.remove();
            rowList.pop();
        }

        if (!contact.messages) contact.messages = [];
        allFinishedBubbleTexts.forEach((text, idx) => {
            if (text) {
                const msgId = 'msg_' + Date.now() + '_' + idx;
                contact.messages.push({
                    id: msgId, sender: 'char', text: text, time: timeStr
                });
                
                // 🌟 将打字完成的节点赋予真实身份，防止无法长按和多选！
                const row = rowList[idx];
                if (row) {
                    row.id = `row-${msgId}`;
                    row.setAttribute('onclick', `handleMsgClickInMultiMode('${msgId}', this)`);
                    row.setAttribute('ontouchstart', `bubbleTouchStart(event, '${msgId}', 'char', '${timeStr}')`);
                    row.setAttribute('ontouchend', `bubbleTouchEnd(event)`);
                    row.setAttribute('ontouchmove', `bubbleTouchEnd(event)`);
                    row.setAttribute('onmousedown', `bubbleTouchStart(event, '${msgId}', 'char', '${timeStr}')`);
                    row.setAttribute('onmouseup', `bubbleTouchEnd(event)`);
                    row.setAttribute('onmouseleave', `bubbleTouchEnd(event)`);
                }
            }
        });


        if (allFinishedBubbleTexts.length > 0) {
            const lastMsg = allFinishedBubbleTexts[allFinishedBubbleTexts.length - 1];
            contact.sign = lastMsg.replace(/\n/g, ' ');
            contact.time = timeStr;
        }
        saveToDB('contacts_data', JSON.stringify(contactsList));
        renderMsgList();
        
        titleEl.innerText = originalName;
        isAiReplying = false; 

        // 🌟 检查并触发自动总结
        checkAndTriggerAutoSummary(contact.id);
    }


    // ================= 网络接收线程 =================
    try {
        const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.apiKey}`,
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify({
                model: apiConfig.model,
                messages: messagesPayload,
                temperature: parseFloat(apiConfig.temp),
                presence_penalty: parseFloat(apiConfig.pres),
                frequency_penalty: parseFloat(apiConfig.freq),
                top_p: parseFloat(apiConfig.topp),
                stream: true
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let sseBuffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop(); 

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;
                const dataStr = trimmed.slice(5).trim();
                if (dataStr === '[DONE]') continue;

                try {
                    const parsed = JSON.parse(dataStr);
                    const delta = parsed.choices?.[0]?.delta?.content;
                    if (delta == null || delta === '') continue;

                    // 将网络发来的大段文字，切碎成单个字符塞进排队队列
                    unprocessedText += delta;

                     // 🌟 终极心声隐形拦截器
                    while (unprocessedText.length > 0) {
                        if (!isVoiceBlock) {
                            let idx = unprocessedText.indexOf('<voice>');
                            if (idx !== -1) {
                                // 发现了 <voice> 起点，把前面的字推入屏幕，开启隐形捕获模式
                                let before = unprocessedText.slice(0, idx);
                                processQueueText(before);
                                isVoiceBlock = true;
                                unprocessedText = unprocessedText.slice(idx + 7);
                            } else {
                                // 检查文本末尾是否可能是 <voice> 的部分前缀 (防截断)
                                let partialMatch = false;
                                for (let i = 1; i <= Math.min(unprocessedText.length, 7); i++) {
                                    let suffix = unprocessedText.slice(-i);
                                    if ('<voice>'.startsWith(suffix)) {
                                        partialMatch = true;
                                        break;
                                    }
                                }
                                if (partialMatch) {
                                    break; // 疑似标签，停止推入屏幕，等待下一次网络块合并
                                } else {
                                    // 确定安全，推入屏幕
                                    processQueueText(unprocessedText);
                                    unprocessedText = '';
                                }
                            }
                        } else {
                            // 正在隐形捕获心声内容
                            let idx = unprocessedText.indexOf('</voice>');
                            if (idx !== -1) {
                                voiceBuffer += unprocessedText.slice(0, idx);
                                isVoiceBlock = false;
                                unprocessedText = unprocessedText.slice(idx + 8);
                            } else {
                                voiceBuffer += unprocessedText;
                                unprocessedText = '';
                            }
                        }
                    }
                } catch (e) {
                    console.error("解析SSE块错误", e);
                }
            }
        } // 结束 while (true)

        // 网络结束，把剩下的尾巴也塞进队列
        for (let i = 0; i < unprocessedText.length; i++) {
            charQueue.push(unprocessedText[i]);
        }
        networkDone = true; 

    } catch (error) {

        networkDone = true;
        titleEl.innerText = originalName;
        showToast("API 错误: " + error.message);
    }
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
    
    // 🌟 一旦点击了预设气泡，立刻清空全局自定义 CSS
    let styleEl = document.getElementById('dynamic-bubble-css');
    if (styleEl) styleEl.innerHTML = '';
    saveToDB('custom_bubble_css', '');

    // 🌟 如果正在某个角色的设置页里，同步清空该角色的专属 CSS，防止残留覆盖
    if (currentChatContactId) {
        const contact = contactsList.find(c => c.id === currentChatContactId);
        if (contact && contact.customBubbleCss) {
            contact.customBubbleCss = '';
            saveToDB('contacts_data', JSON.stringify(contactsList));
        }
    }
    let charStyleEl = document.getElementById('char-specific-bubble-css');
    if (charStyleEl) charStyleEl.innerHTML = '';

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

/* ==========================================
   🌟 唯一关键词：【高级自定义气泡引擎 (纯CSS版 & 角色独立控制)】
========================================== */
let customBubblePlans = [];
let tempPreviewBubbleData = null; 

const defaultCssTemplate = `/* 🌟 用户气泡 (右侧) */
.Toutou-TT.user .content {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #ffffff;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 4px 12px rgba(255,154,158,0.3);
}
/* 隐藏原版用户小尾巴 */
.Toutou-TT.user .content::after { display: none; }

/* 🌟 角色气泡 (左侧) */
.Toutou-TT.char .content {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  color: #333333;
  border: 1px solid #ffffff;
  border-radius: 18px 18px 18px 4px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.04);
}
/* 隐藏原版角色小尾巴 */
.Toutou-TT.char .content::after { display: none; }`;

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
window.addEventListener('load', loadCustomBubblePlans);

function openCustomBubbleMenu() { document.getElementById('bubbleMenuOverlay').classList.add('active'); }

function openBubblePanel(type) {
    document.getElementById('bubbleMenuOverlay').classList.remove('active');
    const panel = document.getElementById('custom-bubble-panel');
    panel.style.display = 'flex';

    if (type === 'create') renderBubbleCreatePanel();
    else if (type === 'list') renderBubbleListPanel();
}

function renderBubbleCreatePanel() {
    const panel = document.getElementById('custom-bubble-panel');
    panel.innerHTML = `
        <div style="font-size: 11px; font-weight: 800; color: #a0a0a0; margin-bottom: 8px;">新建气泡方案 (编写 CSS 结构)</div>
        <textarea id="custom-bubble-css-input" style="width:100%; height:180px; background:#f9f9f9; border:none; border-radius:12px; padding:12px; font-size:11px; font-family:monospace; color:#444; outline:none; resize:none; line-height:1.5; box-shadow: inset 0 2px 5px rgba(0,0,0,0.02);"></textarea>
        <div style="display:flex; gap:10px; margin-top:12px;">
            <div class="inset-btn" onclick="document.getElementById('custom-bubble-panel').style.display='none'">关闭</div>
            <div class="inset-btn" style="color:#000;" onclick="applyTempBubblePreview()">预览效果</div>
            <div class="inset-btn" style="color:#000;" onclick="promptSaveCustomBubble()">保存方案</div>
        </div>
    `;
    document.getElementById('custom-bubble-css-input').value = defaultCssTemplate;
    tempPreviewBubbleData = null;
}

function applyTempBubblePreview() {
    const cssStr = document.getElementById('custom-bubble-css-input').value.trim();
    if (!cssStr) { showToast('CSS 代码不能为空'); return; }
    
    let styleEl = document.getElementById('dynamic-bubble-css');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-bubble-css';
        document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = cssStr;
    tempPreviewBubbleData = cssStr;
    
    document.querySelectorAll('.bubble-theme-item').forEach(el => el.classList.remove('active'));
    showToast('预览效果已更新');
}

function promptSaveCustomBubble() {
    if (!tempPreviewBubbleData) { showToast('请先点击 [预览效果] 确认代码无误！'); return; }
    openCustomPrompt('保存气泡代码', 'action_save_custom_bubble', '输入方案名称', 'input');
}

function renderBubbleListPanel() {
    const panel = document.getElementById('custom-bubble-panel');
    let listHtml = '';
    
    if (customBubblePlans.length === 0) {
        listHtml = `<div style="text-align:center; padding:20px; color:#999; font-size:12px;">暂无保存的美化方案</div>`;
    } else {
        customBubblePlans.forEach(plan => {
            // 🌟 移除左侧的 CSS 方块，文字往左靠
            listHtml += `
            <div style="display:flex; align-items:center; justify-content:space-between; background:#f9f9f9; padding:10px 12px; border-radius:12px; margin-bottom:8px;">
                <div style="display:flex; align-items:center; flex:1; cursor:pointer; padding-left: 4px;" onclick="previewSavedBubble('${plan.id}')">
                    <span style="font-size:13px; font-weight:700; color:#333;">${plan.name}</span>
                </div>
                <div style="display:flex; gap:6px;">
                    <div style="padding:5px 12px; background:#fff; color:#000; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.05);" onclick="promptApplyBubbleScope('${plan.id}')">应用</div>
                    <div style="padding:5px 12px; background:#ff3b30; color:#fff; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer; box-shadow: 0 2px 5px rgba(255,59,48,0.2);" onclick="deleteSavedBubble('${plan.id}')">删除</div>
                </div>
            </div>
            `;
        });
    }

    panel.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
            <span style="font-size: 11px; font-weight: 800; color: #a0a0a0;">已保存的美化方案</span>
            <span style="font-size: 12px; font-weight: 700; color: #666; cursor:pointer;" onclick="document.getElementById('custom-bubble-panel').style.display='none'">关闭</span>
        </div>
        <div style="max-height: 220px; overflow-y: auto;">
            ${listHtml}
        </div>
    `;
}

function previewSavedBubble(id) {
    const plan = customBubblePlans.find(p => p.id === id);
    if (!plan) return;
    
    let styleEl = document.getElementById('dynamic-bubble-css');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-bubble-css';
        document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = plan.data;
    document.querySelectorAll('.bubble-theme-item').forEach(el => el.classList.remove('active'));
    showToast(`正在预览: ${plan.name}`);
}

// 🌟 新增：独立与全局应用的弹窗逻辑
let bubblePlanToApply = null;

function promptApplyBubbleScope(id) {
    bubblePlanToApply = id;
    let overlay = document.getElementById('bubble-scope-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'bubble-scope-overlay';
        overlay.className = 'custom-prompt-overlay'; 
        overlay.innerHTML = `
            <div class="custom-prompt-box" style="width: 260px;">
                <div class="custom-prompt-title">应用美化方案</div>
                <div class="custom-prompt-msg" style="display:block; margin-bottom:20px; font-size: 12px;">请选择该气泡方案的应用范围</div>
                <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
                    <div class="inset-btn" style="color:#000; padding:14px 0;" onclick="executeApplyBubble('global')">全局应用 (所有角色)</div>
                    <div class="inset-btn" style="color:#000; padding:14px 0;" onclick="executeApplyBubble('single')">仅当前聊天角色</div>
                    <div class="inset-btn" style="color:#ff3b30; margin-top:5px; padding:14px 0;" onclick="document.getElementById('bubble-scope-overlay').classList.remove('active')">取消</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    setTimeout(() => overlay.classList.add('active'), 10);
}

function executeApplyBubble(scope) {
    document.getElementById('bubble-scope-overlay').classList.remove('active');
    const plan = customBubblePlans.find(p => p.id === bubblePlanToApply);
    if (!plan) return;

    if (scope === 'global') {
        let styleEl = document.getElementById('dynamic-bubble-css');
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'dynamic-bubble-css';
            document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = plan.data;
        saveToDB('custom_bubble_css', plan.data);

        // 清除当前角色的专属CSS，防止覆盖全局
        if (currentChatContactId) {
            const contact = contactsList.find(c => c.id === currentChatContactId);
            if (contact && contact.customBubbleCss) {
                contact.customBubbleCss = '';
                saveToDB('contacts_data', JSON.stringify(contactsList));
            }
        }
        let charStyleEl = document.getElementById('char-specific-bubble-css');
        if (charStyleEl) charStyleEl.innerHTML = '';

        document.querySelectorAll('.bubble-theme-item').forEach(el => el.classList.remove('active'));
        showToast(`已全局应用：${plan.name}`);

    } else if (scope === 'single') {
        if (!currentChatContactId) {
            showToast('当前未在角色的聊天设置页内，无法单独应用！');
            return;
        }
        const contact = contactsList.find(c => c.id === currentChatContactId);
        if (contact) {
            contact.customBubbleCss = plan.data;
            saveToDB('contacts_data', JSON.stringify(contactsList));
            
            // 实时注入该角色的专属 CSS，优先级高于全局
            let charStyleEl = document.getElementById('char-specific-bubble-css');
            if (!charStyleEl) {
                charStyleEl = document.createElement('style');
                charStyleEl.id = 'char-specific-bubble-css';
                document.head.appendChild(charStyleEl);
            }
            charStyleEl.innerHTML = plan.data;
            
            document.querySelectorAll('.bubble-theme-item').forEach(el => el.classList.remove('active'));
            showToast(`已为 ${contact.name} 单独应用`);
        }
    }
}

// 🌟 调起删除的二次确认弹窗
let bubblePlanToDelete = null;
function deleteSavedBubble(id) {
    bubblePlanToDelete = id;
    openCustomPrompt('删除美化方案', 'action_delete_bubble_plan', '确定要彻底删除该美化方案吗？', 'confirm_delete');
}

// ==========================================
// 🌟 独家：静默后台大模型自动总结系统
// ==========================================
async function checkAndTriggerAutoSummary(contactId) {
    const contact = contactsList.find(c => c.id === contactId);
    if (!contact || !contact.messages) return;

    // 🌟 新增防重入并发锁，彻底终结一次对话触发两次总结的 Bug
    if (contact.isSummarizing) return;

    const autoRounds = contact.autoSummaryRounds || 30;
    if (autoRounds <= 0) return; // 如果设为 0 则代表关闭自动总结

    const msgCount = contact.messages.length;
    const lastSumIndex = contact.lastSummaryMsgIndex || 0;

    // 一轮通常等于两条消息(user+ai)，所以目标是 autoRounds * 2
    if (msgCount - lastSumIndex >= autoRounds * 2) {
        contact.isSummarizing = true; // 🔒 立即上锁，禁止其他请求闯入
        const msgsToSummarize = contact.messages.slice(lastSumIndex, msgCount);
        
        // 提前锁定指针，防止在请求过程中触发重复总结
        contact.lastSummaryMsgIndex = msgCount;
        saveToDB('contacts_data', JSON.stringify(contactsList));

        // 丢入后台静默执行，并在结束后无论成功还是失败都必定解锁
        doAutoSummaryCall(contact, msgsToSummarize).finally(() => {
            contact.isSummarizing = false; // 🔓 任务收尾，解除锁定
        });
    }
}

async function doAutoSummaryCall(contact, msgsToSummarize) {
    if (!activeApiPlanId || apiPlans.length === 0) return;
    const apiConfig = apiPlans.find(p => p.id === activeApiPlanId)?.data;
    if (!apiConfig || !apiConfig.apiKey) return;

    // 🌟 修复：后台自动总结引擎也必须强制读取该角色专属绑定的身份卡
    let boundProfileId = contact.boundProfileId || 'default';
    let ud = profilePlans.find(p => p.id === boundProfileId)?.data || {};
    let cd = contact.details || {};
    let userStr = `姓名:${ud['text-profile-name']} 性别:${ud['text-detail-gender']} 档案:${ud['text-secret-file']||'无'}`;
    let charStr = `姓名:${contact.realName||contact.name} 性别:${cd.gender} 设定:${cd.secretFile||'无'}`;
    
    let wbStr = "";
    // 🌟 核心修改：后台自动总结也必须剥离“全部分类”的世界书，防止污染记忆与消耗冗余 Token
    let charRealName = contact.realName || contact.name;
    [...activeWorldbooks.filter(b => b.category === '专属' && b.subGroup === charRealName),
     ...activeWorldbooks.filter(b => b.category === '通用' && b.commonBoundChar === charRealName)].forEach(wb => {
        wb.entries.forEach(e => { wbStr += `[${e.name}]: ${e.content}\n`; });
    });


        // 🌟 提取真实姓名，方便构建对话剧本
        let myName = ud['text-profile-name'] || '我';
        let charName = contact.realName || contact.name || '对方';

        // 🌟 核心修复：把聊天记录彻底转化为“客观剧本文本”，绝不用原始的对话数组去误导AI！
        let chatLogText = "";
        msgsToSummarize.forEach(m => {
            let speaker = m.sender === 'user' ? myName : charName;
            chatLogText += `【${speaker}】：${m.text}\n`;
        });

        // 🌟 上帝视角小说向总结 Prompt (将对话文本直接缝合进 Prompt 里)
        const summaryPrompt = `现在开始总结提供的这段聊天记录。你需要用第三人称，作为一个上帝视角的助手去总结整个故事的所有情节发展脉络、人物关系变化和进展。不要忽略其中的约定、小细节以及重要事件。每次的总结字数不可以少于50字，最多250字。
        
【${myName}(我) 的设定】
${userStr}
【${charName}(对方) 的设定】
${charStr}
【世界书设定】
${wbStr}

【需要你总结的聊天剧本如下】：
${chatLogText}

请仔细阅读以上剧本，以客观的上帝视角，写一段包含双方行为和对话剧情的详细总结：`;

        // 🌟 彻底抛弃 system 和 assistant 标签，将整个任务包裹在一个单一的 User 请求里，绝杀 AI 的身份认知错乱
        let messagesPayload = [{ role: "user", content: summaryPrompt }];

        try {
            const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {

            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.apiKey}` },
            body: JSON.stringify({
                model: apiConfig.model,
                messages: messagesPayload,
                temperature: 0.5, // 总结模式使用较低的温度，保证客观精准
                presence_penalty: 0,
                frequency_penalty: 0,
                top_p: 0.9
            })
        });

        if (response.ok) {
            const data = await response.json();
            const summaryText = data.choices[0].message.content;
            
            const now = new Date();
            const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            if (!contact.historySummaries) contact.historySummaries = [];
            contact.historySummaries.push({
                id: 'sum_auto_' + Date.now(),
                timeRange: `自动总结 - ${dateStr}`,
                content: summaryText
            });
            
            saveToDB('contacts_data', JSON.stringify(contactsList));
            
            // 如果你此刻正处在这个人的聊天室，弹个低调的 Toast 提示
            if (currentChatContactId === contact.id) {
                showToast("后台自动记忆总结已完成并归档");
            }
        }
    } catch (e) {
        console.error("后台自动总结触发失败", e);
        // 如果网络断了，把指针退回去，下次讲话时再试
        contact.lastSummaryMsgIndex -= msgsToSummarize.length;
        saveToDB('contacts_data', JSON.stringify(contactsList));
    }
}


// ==========================================
// 🌟 角色心声（隐形XML数据拦截）与登录保险箱系统
// ==========================================

// 解析 XML 并保存到联系人数据，同时刷新药丸文本
function parseAndSaveVoice(xmlString, contact) {
    const getTag = (tag, source = xmlString) => {
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = source.match(regex);
        return match ? match[1].trim() : '';
    };
    if (!contact.innerVoice) contact.innerVoice = {};
    contact.innerVoice.location = getTag('location');
    contact.innerVoice.action = getTag('action');
    
    // 🌟 取消了 20 字物理截断，直接保留大模型生成的完整句子（Prompt中已要求20字内写完完整句子）
    contact.innerVoice.thought = getTag('thought').replace(/\n/g, '').trim();
    
    // 解析大模型出的防偷窥选择题
     const quizTagMatch = xmlString.match(/<quiz>([\s\S]*?)<\/quiz>/i);
    if (quizTagMatch) {
        let qStr = quizTagMatch[1];
        contact.innerVoice.quiz = {
            q: getTag('question', qStr),
            o1: getTag('option1', qStr),
            o2: getTag('option2', qStr),
            o3: getTag('option3', qStr),
            ans: getTag('answer', qStr).replace(/[^1-3]/g, '') 
        };
    } else {
        contact.innerVoice.quiz = null; 
    }

    // 🌟 解析十年留声机未来数据
    const futureTagMatch = xmlString.match(/<future>([\s\S]*?)<\/future>/i);
    if (futureTagMatch) {
        let fStr = futureTagMatch[1];
        contact.innerVoice.future = {
            identity: getTag('identity', fStr),
            content: getTag('content', fStr)
        };
    } else {
        contact.innerVoice.future = null;
    }

    // 接收新数据时触发重置解锁逻辑，并清空之前的惩罚计数

    contact.innerVoice.locked = false;
    contact.innerVoice.errorCount = 0;
    
    if (currentChatContactId === contact.id && contact.innerVoice.thought) {
        const textEl = document.getElementById('chat-init-text');
        if (textEl) {
            textEl.style.opacity = 0;
            setTimeout(() => {
                textEl.innerText = contact.innerVoice.thought;
                textEl.style.opacity = 1;
            }, 300);
        }
    }
}

// 纯黑底白字无圆角的 Toast 报错弹窗 (点击屏幕任意位置立即消失)
function showMindBlackToast(msg) {
    const toast = document.getElementById('mind-black-toast');
    toast.innerText = msg;
    toast.classList.add('active');
    
    // 先移除上一次绑定的点击事件，防止重复触发
    document.removeEventListener('click', hideMindBlackToast);
    
    // 延迟 10 毫秒绑定事件，防止因为触发这个弹窗的那次“点击”被立刻捕捉到而瞬间关闭
    setTimeout(() => {
        document.addEventListener('click', hideMindBlackToast);
    }, 10);
}

// 关闭弹窗并解除监听
function hideMindBlackToast() {
    document.getElementById('mind-black-toast').classList.remove('active');
    document.removeEventListener('click', hideMindBlackToast);
}

// 🌟 彻底废弃旧的本地存储，改为纯粹的明文/密文显示切换逻辑
function toggleMindRemember() {
    const pwdInput = document.getElementById('mind-pwd-input');
    const chk = document.getElementById('mind-remember-chk');
    
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text'; // 变为明文
        chk.classList.add('active');
    } else {
        pwdInput.type = 'password'; // 变为圆点
        chk.classList.remove('active');
    }
}

function openInnerVoice() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    if (!contact.innerVoice || !contact.innerVoice.thought) {
        showMindBlackToast("当前暂无截获的内心数据。");
        return;
    }

    if (contact.innerVoice.locked) {
        showMindBlackToast("被锁了呢");
        return;
    }

    // 🌟 每次打开时，默认恢复为密文模式 (圆点)
    const pwdInput = document.getElementById('mind-pwd-input');
    const chk = document.getElementById('mind-remember-chk');
    pwdInput.type = 'password';
    chk.classList.remove('active');

    let tag1 = contact.details && contact.details.tag1 ? contact.details.tag1 : "前缀";
    const displayId = `${tag1}@Toutou.com`;
    document.getElementById('mind-id-input').value = displayId;

    let myName = currentTempPlan['text-profile-name'] || baseDefaults['text-profile-name'];
    let myBday = currentTempPlan['text-detail-birthday'] || "";
    let bdayStr = myBday ? myBday.split('-')[1] + myBday.split('-')[2] : ""; // 提取MMDD
    const correctPwd = `${getPinyinInitials(myName)}${bdayStr}`; // 🌟 修正为：拼音首字母 + 月日

    // ✅ 去除了致命的重复 const 声明，起死回生！
    pwdInput.value = correctPwd; 

    document.getElementById('mind-login-view').style.display = 'block';
    document.getElementById('mind-quiz-view').style.display = 'none';
    document.getElementById('mind-content-view').style.display = 'none';

    // 🌟 核心拦截：提前强制隐藏十年后区域，以免在输入密码时泄露
    const futureSection = document.getElementById('future-comment-section');
    if (futureSection) futureSection.style.display = 'none';

     document.getElementById('inner-voice-overlay').classList.add('active');
    
    // 🌟 已移除自动触发解锁逻辑，现在仅填入密码，等待用户手动点击 ACCESS 按钮验证
}



function closeInnerVoice(event) {
    if (event && (event.target.id === 'inner-voice-overlay' || event.currentTarget.id === 'inner-voice-overlay')) {
        document.getElementById('inner-voice-overlay').classList.remove('active');
        hideMindBlackToast(); // 顺带关掉黑弹窗
    }
}

// 🌟 补全十年后音频解封播放逻辑与链路动画
function playFutureVoice() {
    const playBtn = document.getElementById('future-play-btn');
    const glassLayer = document.getElementById('future-glass-layer');
    const textEl = document.getElementById('future-comment-text');

    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact || !contact.innerVoice || !contact.innerVoice.future) return;

    // 填入十年后的留言文字
    textEl.innerText = contact.innerVoice.future.content;

    // 动画链路：仅隐藏按钮 -> 解除毛玻璃
    playBtn.classList.add('hidden-anim');
    glassLayer.classList.add('unlocked');

    // 假设展示时间根据文字长度而定
    const readTime = Math.max(3000, contact.innerVoice.future.content.length * 150);
    setTimeout(() => {
        // 展示结束，毛玻璃重新盖上保护隐私
        setTimeout(() => {
            glassLayer.classList.remove('unlocked');
            playBtn.classList.remove('hidden-anim');
        }, 3000);
    }, readTime);
}

function verifyVoiceLogin() {
    if (!currentChatContactId) return;

    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    let myName = currentTempPlan['text-profile-name'] || baseDefaults['text-profile-name'];
    let myBday = currentTempPlan['text-detail-birthday'] || "";
    let bdayStr = myBday ? myBday.split('-')[1] + myBday.split('-')[2] : ""; // 提取MMDD
    const correctPwd = `${getPinyinInitials(myName)}${bdayStr}`; // 🌟 变更为：拼音首字母 + 月日


    const inputPwd = document.getElementById('mind-pwd-input').value.trim();

    if (inputPwd === correctPwd) {
        contact.innerVoice.errorCount = 0; 
        saveToDB('contacts_data', JSON.stringify(contactsList));
        
        if (contact.innerVoice.quiz && contact.innerVoice.quiz.ans) {
            showMindQuiz(contact);
        } else {
            showMindContent(contact);
        }
    } else {
        if (!contact.innerVoice.errorCount) contact.innerVoice.errorCount = 0;
        contact.innerVoice.errorCount += 1;

        if (contact.innerVoice.errorCount === 1 || contact.innerVoice.errorCount === 2) {
            showMindBlackToast("想要查看心声，还不知道对方的密码？给你点提示吧，密码是你的名字与生日^^。");
        } else {
            contact.innerVoice.locked = true;
            saveToDB('contacts_data', JSON.stringify(contactsList));
            document.getElementById('inner-voice-overlay').classList.remove('active');
            showMindBlackToast("被锁了呢");
        }
    }
}

// 渲染答题视窗
function showMindQuiz(contact) {
    document.getElementById('mind-login-view').style.display = 'none';
    document.getElementById('mind-quiz-view').style.display = 'block';
    
    document.getElementById('voice-quiz-q').innerText = contact.innerVoice.quiz.q;
    document.getElementById('voice-quiz-opt1').innerText = "A. " + contact.innerVoice.quiz.o1.replace(/^[A-C]\.\s*/i, '');
    document.getElementById('voice-quiz-opt2').innerText = "B. " + contact.innerVoice.quiz.o2.replace(/^[A-C]\.\s*/i, '');
    document.getElementById('voice-quiz-opt3').innerText = "C. " + contact.innerVoice.quiz.o3.replace(/^[A-C]\.\s*/i, '');
}

// 检查作答对错
function checkVoiceQuiz(choiceNum) {
    const contact = contactsList.find(c => c.id === currentChatContactId);
    let correctAns = contact.innerVoice.quiz.ans; 
    
    // 🌟 增加容错率：只要 AI 生成的答案包含了你选的数字，或者解析为空，都直接放行
    if (!correctAns || correctAns.includes(choiceNum.toString())) {
        showMindContent(contact); 
    } else {
        showMindBlackToast("选项错误。"); 
    }
}

// 最终展示心声库数据
function showMindContent(contact) {
    document.getElementById('voice-location').innerText = contact.innerVoice.location || "未知";
    document.getElementById('voice-action').innerText = contact.innerVoice.action || "发呆";
    document.getElementById('voice-thought').innerText = contact.innerVoice.thought || "...";

    // 🌟 纸张拓展区域：十年后评论
    const futureSection = document.getElementById('future-comment-section');
    
    if (contact.innerVoice.future && contact.innerVoice.future.content) {
        futureSection.style.display = 'flex'; // ✨ 变更为 flex，彻底适配新的独立卡片群排版
        document.getElementById('future-identity-pill').innerText = `十年后的${contact.innerVoice.future.identity}正在评论`;

        
        // 🌟 初始化/重置所有动画状态，保证每次打开都是模糊待点击状态
        const playBtn = document.getElementById('future-play-btn');
        const glassLayer = document.getElementById('future-glass-layer');
        
        if (playBtn) playBtn.classList.remove('hidden-anim');
        if (glassLayer) glassLayer.classList.remove('unlocked');
        
    } else {
        futureSection.style.display = 'none';
    }

    // 🌟 恢复正确的显示逻辑：隐藏登录框，展示心声结果！并补回大括号
    document.getElementById('mind-login-view').style.display = 'none';
    document.getElementById('mind-quiz-view').style.display = 'none';
    document.getElementById('mind-content-view').style.display = 'block';
}



// ==========================================
// 🌟 左下角 + 号半屏菜单 (带有软键盘防撞车拦截)
// ==========================================
let chatPlusMenuTimer = null; // 🌟 新增防重入锁

function toggleChatPlusMenu(event) {
    if (event) event.stopPropagation();
    const overlay = document.getElementById('chat-plus-overlay');
    const menu = document.getElementById('chat-plus-menu');
    const screen = document.getElementById('chatRoomScreen');
    
    // 🌟 一旦发生新动作，立刻粉碎历史遗留的幽灵定时器！
    if (chatPlusMenuTimer) {
        clearTimeout(chatPlusMenuTimer);
        chatPlusMenuTimer = null;
    }

    if (menu.classList.contains('active')) {
        closeChatPlusMenu();
    } else {
        // 🌟 核心防错位：强制剥夺输入框焦点，收回软键盘
        if (document.activeElement && document.activeElement.id === 'chatRoomInput') {
            document.activeElement.blur(); 
        }
        
        // 🌟 延时弹出，并留存定时器ID随时可被撤销
        chatPlusMenuTimer = setTimeout(() => {
            overlay.classList.add('active');
            menu.classList.add('active');
            screen.classList.add('plus-active');
            chatPlusMenuTimer = null;
        }, 150);
    }
}

function closeChatPlusMenu() {
    // 🌟 绝对镇压：哪怕菜单还没弹出来，只要点了关闭，直接处死还在排队的弹出指令！
    if (chatPlusMenuTimer) {
        clearTimeout(chatPlusMenuTimer);
        chatPlusMenuTimer = null;
    }
    document.getElementById('chat-plus-overlay').classList.remove('active');
    document.getElementById('chat-plus-menu').classList.remove('active');
    document.getElementById('chatRoomScreen').classList.remove('plus-active');
}

// 🌟 联动防御：一旦用户点击输入框准备打字，立刻无条件关闭底部的半屏菜单！
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatRoomInput');
    if (chatInput) {
        // 解决文字框自适应高度
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto'; 
            this.style.height = this.scrollHeight + 'px';
        });
        // 当点进输入框时，立即关闭下方的拓展菜单，把空间让给输入法
        chatInput.addEventListener('focus', function() {
            const menu = document.getElementById('chat-plus-menu');
            if (menu && menu.classList.contains('active')) {
                closeChatPlusMenu();
            }
        });
    }
});

// ==========================================
// 🌟 气泡长按菜单引擎 (动态定位与动态选项)
// ==========================================
let bubblePressTimer = null;
let currentActionBubbleId = null;
let currentActionBubbleSender = null;
let currentActionBubbleTimeStr = null;
let currentBubbleEventTarget = null; 

// 多选模式全局控制
let isMultiSelectMode = false;
let selectedMsgIndices = new Set(); 

function bubbleTouchStart(event, msgId, sender, timeStr) {
    if (isMultiSelectMode) return; // 🌟 多选模式下物理屏蔽长按
    event.stopPropagation();
    currentBubbleEventTarget = event.currentTarget; 
    bubblePressTimer = setTimeout(() => {
        openBubbleMenu(msgId, sender, timeStr);
    }, 600);
}

function bubbleTouchEnd(event) {
    if (bubblePressTimer) clearTimeout(bubblePressTimer);
}

function openBubbleMenu(msgId, sender, timeStr) {
    if (bubblePressTimer) clearTimeout(bubblePressTimer);
    if (!currentChatContactId) return;
    if (document.activeElement) document.activeElement.blur();
    
    currentActionBubbleId = msgId;
    currentActionBubbleSender = sender;
    currentActionBubbleTimeStr = timeStr;
    
    const overlay = document.getElementById('bubble-action-overlay');
    const menu = document.getElementById('bubble-action-menu');
    const recallBtn = document.getElementById('b-action-recall');
    const replyBtn = document.getElementById('b-action-reply');
    
    // 🌟 核心：引用与撤回按钮的排他性显示 (已去除严苛的3分钟限制，彻底释放撤回自由)
    if (sender === 'user') {
        if(replyBtn) replyBtn.style.display = 'none'; // 我方无引用
        if(recallBtn) recallBtn.style.display = 'flex'; // 我方无条件可撤回
    } else {
        if(replyBtn) replyBtn.style.display = 'flex'; // 对方有引用
        if(recallBtn) recallBtn.style.display = 'none'; // 对方无撤回
    }
    
    if (currentBubbleEventTarget) {
        let bubbleEl = currentBubbleEventTarget.querySelector('.content') || currentBubbleEventTarget;
        const rect = bubbleEl.getBoundingClientRect();
        
        let centerX = rect.left + rect.width / 2;
        let topY = rect.top - 8; 
        
        const menuWidthEst = 260; 
        if (centerX < menuWidthEst / 2 + 10) centerX = menuWidthEst / 2 + 10;
        if (centerX > window.innerWidth - (menuWidthEst / 2 + 10)) centerX = window.innerWidth - (menuWidthEst / 2 + 10);

        if (topY < 60) {
            topY = rect.bottom + 8;
            menu.classList.add('top-arrow');
            menu.classList.remove('bottom-arrow');
        } else {
            menu.classList.add('bottom-arrow');
            menu.classList.remove('top-arrow');
        }

        menu.style.left = `${centerX}px`;
        menu.style.top = `${topY}px`;
    }

    overlay.classList.add('active');
}

function closeBubbleMenu() {
    document.getElementById('bubble-action-overlay').classList.remove('active');
}

function bubbleAction(action) {
    closeBubbleMenu();
    if (!currentChatContactId || !currentActionBubbleId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact || !contact.messages) return;
    
    const msgIndex = contact.messages.findIndex(m => m.id === currentActionBubbleId);
    if (msgIndex === -1) return;
    const msg = contact.messages[msgIndex];

    if (action === 'copy') {
        navigator.clipboard.writeText(msg.text).then(() => showToast('已复制')).catch(() => showToast('复制失败'));
    } else if (action === 'delete') {
        contact.messages.splice(msgIndex, 1);
        saveToDB('contacts_data', JSON.stringify(contactsList));
        showToast('已删除');
        openChatRoom(currentChatContactId); 
    } else if (action === 'recall') {
        contact.messages.splice(msgIndex, 1);
        saveToDB('contacts_data', JSON.stringify(contactsList));
        showToast('你撤回了一条消息');
        openChatRoom(currentChatContactId); 
    } else if (action === 'multi') {
        enterMultiSelectMode(currentActionBubbleId); // 🌟 触发多选
    } else if (action === 'reply') {
        showToast('回复引用业务逻辑已成功接管');
        // 将来可在此注入真实输入框引用的函数
    } else if (action === 'translate') {
        showToast('正在接入AI翻译引擎...');
    }

}


// ==========================================
// 🌟 全局多选批量删除模式
// ==========================================

function enterMultiSelectMode(initialMsgId = null) {
    isMultiSelectMode = true;
    selectedMsgIndices.clear();
    document.getElementById('chatRoomScreen').classList.add('multi-select-mode');
    
    if (initialMsgId) {
        const row = document.getElementById(`row-${initialMsgId}`);
        if (row) {
            handleMsgClickInMultiMode(initialMsgId, row);
        }
    } else {
        updateMultiSelectHeader();
    }
}

function exitMultiSelectMode() {
    isMultiSelectMode = false;
    selectedMsgIndices.clear();
    document.getElementById('chatRoomScreen').classList.remove('multi-select-mode');
    document.querySelectorAll('.preview-msg-row.ms-selected').forEach(el => el.classList.remove('ms-selected'));
    updateMultiSelectHeader();
}

function handleMsgClickInMultiMode(msgId, rowElement) {
    if (!isMultiSelectMode || !msgId) return;
    
    if (selectedMsgIndices.has(msgId)) {
        selectedMsgIndices.delete(msgId);
        rowElement.classList.remove('ms-selected');
    } else {
        selectedMsgIndices.add(msgId);
        rowElement.classList.add('ms-selected');
    }
    updateMultiSelectHeader();
}

function updateMultiSelectHeader() {
    const count = selectedMsgIndices.size;
    const title = document.getElementById('msTitle');
    const delBtn = document.getElementById('msDeleteBtn');
    if (title) title.innerText = `已选择 ${count} 条`;
    if (delBtn) {
        if (count > 0) {
            delBtn.classList.remove('disabled');
            delBtn.innerText = `删除(${count})`;
        } else {
            delBtn.classList.add('disabled');
            delBtn.innerText = `删除`;
        }
    }
}

function deleteSelectedMessages() {
    if (selectedMsgIndices.size === 0 || !currentChatContactId) return;
    // 🌟 换用层级最高、最稳定的全局弹窗，彻底解决出不来的Bug
    openCustomPrompt('批量删除', 'action_multi_delete', `确定彻底删除选中的 ${selectedMsgIndices.size} 条消息吗？\n(删除后将从历史记录中永久抹除)`, 'confirm_delete');
}
