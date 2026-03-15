// ==========================================
// 02-ui-components.js: UI视图、公共弹窗与资料卡管理
// ==========================================

// ==========================================
// 1. 软件桌面启停与底层导航
// ==========================================

function openAppChat(event) {
    lockDesktopScroll(); // 🌟 锁定桌面 (来自 00-utils)
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
    // 🌟 核心修改：让设置页 (tab-settings) 也脱离手机壳的束缚
    if (tabId === 'tab-profile' || tabId === 'tab-settings') {
        phoneWrapper.style.display = 'none';
    } else {
        phoneWrapper.style.display = 'flex';
    }
}


// ==========================================
// 2. 全局点击空白处自动关闭弹窗的监听器 (资料卡与API页)
// ==========================================

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


// ==========================================
// 3. 全局小白弹窗系统 (Custom Prompt)
// ==========================================

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

// 核心回调分发处理器
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
                    let signText = lastMsg.text.replace(/\n/g, ' ');
                    signText = signText.replace(/\[\s*(?:VOICE|语音)\s*[:：]\s*(.*?)\]/gi, '[语音：$1]');
                    signText = signText.replace(/\[\s*(?:STICKER|表情)\s*[:：]\s*(.*?)\]/gi, '[表情]');
                    contact.sign = lastMsg.type === 'image' ? '[图片]' : (lastMsg.type === 'recall' ? '有条撤回，快来看' : signText);
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
        // 设置页更换头像：只改预览图，点保存时才生效
        if(inputVal !== "") document.getElementById('cs-avatar').src = inputVal;
    } else if (currentTargetId === 'chat-init-avatar-url') {
        // 聊天室顶部大头像更换
        if(inputVal !== "") {
            document.getElementById('img-chat-init-avatar').src = inputVal;
            if (currentChatContactId) {
                const contact = contactsList.find(c => c.id === currentChatContactId);
                if (contact) {
                    contact.chatRoomAvatar = inputVal; 
                    saveToDB('contacts_data', JSON.stringify(contactsList));
                }
            }
        }
    } else if (currentTargetId === 'action_save_plan_name') {
        if(inputVal !== "") executeSavePlan(inputVal);
    } else if (currentTargetId === 'action_new_common_group') {
        if(inputVal !== "") {
            if(!customCommonGroups.includes(inputVal)) customCommonGroups.push(inputVal);
            currentSelectedSubGroup = inputVal;
            updateCommonGroupUI();
        }
    } else if (currentTargetId === 'action_new_nc_group') {
        if(inputVal !== "") {
            if(!ncCustomGroups.includes(inputVal)) ncCustomGroups.push(inputVal);
            selectNcGroup(inputVal); 
        }
    } else if (currentTargetId === 'action_save_custom_bubble') {
        if(inputVal !== "") {
            const newPlan = { id: 'cb_' + Date.now(), name: inputVal, data: tempPreviewBubbleData };
            customBubblePlans.push(newPlan);
            saveToDB('custom_bubble_plans', JSON.stringify(customBubblePlans));
            showToast(`方案 [${inputVal}] 已保存`);
            renderBubbleListPanel(); 
        }
    } else {
        // 默认数据填入
        const finalVal = inputVal === "" ? currentDefaultStr : inputVal;
        const el = document.getElementById(currentTargetId);
        if(el) {
            el.innerText = finalVal;
            // 🌟 如果是 icity 正文修改，则存入专属独立数据库；否则才存入身份卡方案
            if (currentTargetId === 'icity-content-display') {
                saveToDB('icity_custom_content', finalVal);
            } else {
                currentTempPlan[currentTargetId] = finalVal;
                autoSaveTempPlan(); 
            }
        }
    }
    closeCustomPrompt();
}


// ==========================================
// 4. 我的资料卡：基础设定编辑处理
// ==========================================

function focusInlineInput(inputId) {
    const input = document.getElementById(inputId);
    if(input && input.type !== 'date') input.focus();
}

function saveInlineInput(targetId, val) {
    const finalVal = val.trim(); // 直接保存空字符串，不再强行塞入提示字

    const hiddenEl = document.getElementById(targetId);
    if(hiddenEl) hiddenEl.innerText = finalVal;

    const inputEl = document.getElementById(targetId.replace('text-', 'input-'));
    if(inputEl && inputEl.value !== finalVal) inputEl.value = finalVal;

    currentTempPlan[targetId] = finalVal;
    autoSaveTempPlan();
}

function handleEnterSave(event, inputEl) { 
    if (event.key === 'Enter') inputEl.blur(); 
}

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

// ==========================================
// 5. 头像上传处理
// ==========================================
function toggleAvatarMenu() { 
    document.getElementById('avatarActionMenu').classList.toggle('active'); 
}

function changeAvatarLink() {
    toggleAvatarMenu(); 
    openCustomPrompt('输入图片链接', 'global-avatar-url', '', 'input');
}

function triggerLocalAvatar() {
    document.getElementById('localAvatarInput').click(); 
    toggleAvatarMenu();
}

function uploadLocalAvatar(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { updateCurrentAvatar(e.target.result); };
    reader.readAsDataURL(file);
}

async function updateCurrentAvatar(base64orUrl) {
    const el = document.getElementById('img-profile-avatar');
    if(el) el.src = base64orUrl;
    currentTempPlan['avatar'] = base64orUrl;
    autoSaveTempPlan();
}

// ==========================================
// 6. 资料卡与方案多开管理系统
// ==========================================

// 🌟 动态更新右上角资料卡的关联角色小圆圈头像
function updateProfileAvatars() {
    const container = document.getElementById('profile-bound-avatars');
    if(!container) return;
    container.innerHTML = '';
    
    // 🌟 核心：精准筛选出绑定了当前查看的个人资料方案的联系人
    const targetPlanId = currentActivePlanId === 'temp_new' ? null : currentActivePlanId;
    let boundContacts = contactsList.filter(c => {
        let bindId = c.boundProfileId || 'default';
        return bindId === targetPlanId;
    });

    let avatarsToShow = boundContacts.filter(c => c.avatar).map(c => c.avatar).slice(0, 5);
    
    avatarsToShow.forEach((src, index) => {
        let styleStr = `z-index: ${5 - index};`; 
        if (src.includes("data:image/gif")) styleStr += " background: #ccc;"; 
        container.innerHTML += `<img src="${src}" class="notch-avatar-img" style="${styleStr}">`;
    });
}

// 核心渲染器，将后台方案数据绘制到前端页面
function syncViewFromTempPlan() {
    // 🔪 暴力粉碎旧签名缓存：只要包含这些词根，强行判定为垃圾数据并清空
    let badSign = currentTempPlan['text-profile-sign'] || '';
    if (badSign.includes('个性签名') || badSign.includes('点击') || badSign.includes('设置') || badSign.includes('专属备注...')) {
        currentTempPlan['text-profile-sign'] = ''; 
    }

    const clearWords = ['-', 'Unknown Location', '标签']; 
    
    const els = ['text-profile-name', 'text-profile-sign', 'text-detail-gender', 'text-detail-age', 'text-detail-birthday', 'text-detail-zodiac', 'text-detail-location', 'text-tag-1', 'text-tag-2', 'text-tag-3', 'text-secret-file'];
    els.forEach(id => { 
        if (clearWords.includes(currentTempPlan[id])) currentTempPlan[id] = '';
        const dom = document.getElementById(id); 
        // 自动兜底 baseDefaults
        if(dom) dom.innerText = currentTempPlan[id] || (baseDefaults[id] || ''); 
    });

    const inputEls = ['input-detail-gender', 'input-detail-age', 'input-detail-zodiac', 'input-detail-location', 'input-tag-1', 'input-tag-2', 'input-tag-3'];
    inputEls.forEach(id => { 
        const dbId = id.replace('input-', 'text-'); 
        const dom = document.getElementById(id); 
        if(dom) dom.value = currentTempPlan[dbId] || ''; 
    });

    const bdayVal = currentTempPlan['text-detail-birthday'] || '';
    const realBday = document.getElementById('input-detail-birthday'); 
    const dispBday = document.getElementById('display-detail-birthday');
    if(realBday) realBday.value = bdayVal; 
    if(dispBday) dispBday.value = bdayVal;

    const secretTextarea = document.getElementById('input-secret-file');
    if(secretTextarea) secretTextarea.value = currentTempPlan['text-secret-file'] || '';

    const sw = document.getElementById('secretToggleSwitch'); 
    const card = document.getElementById('secretFileCard');
    if(currentTempPlan['secret_mode']) { 
        sw.classList.add('active'); card.classList.remove('closed'); card.classList.add('open'); 
    } else { 
        sw.classList.remove('active'); card.classList.add('closed'); card.classList.remove('open'); 
    }

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
    syncViewFromTempPlan(); 
    saveToDB('active_plan_id', planId); 
    autoSaveTempPlan();
    updateProfileAvatars(); // 🌟 切换方案时刷新右上角绑定的角色头像
}

function togglePlanMenu() {
    const menu = document.getElementById('planActionMenu');
    if (menu) menu.classList.toggle('active');
}

function createNewPlan() {
    togglePlanMenu(); 
    currentActivePlanId = 'temp_new'; 
    document.getElementById('current-plan-name').innerText = "未命名方案";
    currentTempPlan = { ...baseDefaults }; 
    syncViewFromTempPlan(); 
    autoSaveTempPlan();
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
            // 🌟 修复：如果当前是在“默认系统方案”上修改并保存了新名字，强制它另存为一个新方案
            if (currentActivePlanId === 'default' && planName !== profilePlans[planIndex].name) {
                currentActivePlanId = "plan_" + Date.now(); 
                profilePlans.push({ id: currentActivePlanId, name: planName, data: { ...currentTempPlan } }); 
            } else {
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
    updateProfileAvatars(); // 🌟 保存方案时联动刷新
}

function deleteCurrentPlan() {
    togglePlanMenu();
    if (currentActivePlanId === 'temp_new') { applyPlan('default'); return; }
    if (currentActivePlanId === 'default') { showToast("系统默认配置无法删除！"); return; }
    openCustomPrompt('提示', 'action_delete_plan', '确定要删除当前的个人介绍方案吗？', 'confirm_delete');
}

function executeDeletePlan() { 
    profilePlans = profilePlans.filter(p => p.id !== currentActivePlanId); 
    saveToDB('profile_plans', JSON.stringify(profilePlans)); 
    applyPlan('default'); 
}

function autoSaveTempPlan() { 
    saveToDB('temp_profile_plan', JSON.stringify(currentTempPlan)); 
}

// ==========================================
// 7. 全局左侧边栏(主身份)联动应用引擎
// ==========================================

function promptApplyPlan() {
    togglePlanMenu();
    if (currentActivePlanId === 'temp_new') { showToast('请先保存方案后再应用！'); return; }
    openCustomPrompt('应用方案', 'action_apply_plan', '确定将此方案设为全局使用的身份展示吗？\n(这将会同步更换左侧边栏的头像与昵称)', 'confirm_action');
}

function executeApplyPlan() {
    saveToDB('global_applied_profile', currentActivePlanId);
    updateSidebarProfile(currentActivePlanId);
    showToast('已应用到全局身份展示');
}

function updateSidebarProfile(planId) {
    const plan = profilePlans.find(p => p.id === planId) || profilePlans.find(p => p.id === 'default');
    if (plan) {
        const avatarSrc = plan.data['avatar'] || baseDefaults['avatar'];
        const nameText = plan.data['text-profile-name'] || '某某';
        const emailPrefix = plan.data['text-tag-1'] || '前缀'; // 提取你设定的邮箱前缀
        
        const avatarEl = document.getElementById('img-sidebar-avatar');
        const nameEl = document.getElementById('text-sidebar-name');
        if (avatarEl) avatarEl.src = avatarSrc;
        if (nameEl) nameEl.innerText = nameText;

        // 🌟 全息联动更新 icity 日记的卡片信息
        const icityAvatar = document.getElementById('icity-avatar');
        const icityName = document.getElementById('icity-nickname');
        const icityEmail = document.getElementById('icity-email');
        if (icityAvatar) icityAvatar.src = avatarSrc;
        if (icityName) icityName.innerText = nameText;
        // 🌟 将后缀统一更改为你自己的 Toutou.com 设定
        if (icityEmail) icityEmail.innerText = `${emailPrefix}@Toutou.com`;
    }
}


// 方案列表弹窗
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