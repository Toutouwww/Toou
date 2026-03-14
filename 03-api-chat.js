// ==========================================
// 03-api-chat.js: API核心配置与聊天发送渲染引擎
// ==========================================

let activeReplyContext = null; 
const TRANS_SPLIT = "@@@TRANS@@@"; // 🌟 【翻译核心引擎】全局翻译分隔符

// ==========================================
// 1. 千岛 API 配置界面逻辑
// ==========================================

function openApiApp(event) {
    lockDesktopScroll(); 
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
    unlockDesktopScroll(); 
}

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

function toggleUrlMenu() { document.getElementById('urlDropdownMenu').classList.toggle('active'); }

function selectUrl(url) {
    document.getElementById('api-base-url-input').value = url;
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
// 2. 聊天主列表动态渲染与管理
// ==========================================

function toggleMsgAddMenu(event) {
    event.stopPropagation();
    document.getElementById('msg-popover-menu').classList.toggle('active');
}

document.addEventListener('click', function(e) {
    const msgMenu = document.getElementById('msg-popover-menu');
    const msgBtn = document.querySelector('.msg-add-btn');
    if (msgMenu && msgMenu.classList.contains('active') && e.target !== msgBtn && !msgBtn.contains(e.target) && !msgMenu.contains(e.target)) {
        msgMenu.classList.remove('active');
    }
});

function switchMsgSubTab(el, type) {
    const tabs = document.querySelectorAll('.msg-sub-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    el.classList.add('active');
    
    msgCurrentTab = type;
    renderMsgList();
}

function renderMsgList() {
    const unpinnedContainer = document.getElementById('msg-unpinned-list');
    const pinnedContainer = document.getElementById('msg-pinned-list'); 
    const placeholder = document.getElementById('msg-placeholder-text');
    if (!unpinnedContainer || !placeholder || !pinnedContainer) return;

    unpinnedContainer.innerHTML = ''; 
    pinnedContainer.innerHTML = '';   
    
    let filtered = contactsList;
    if (msgCurrentTab === 'FRIENDS') {
        filtered = contactsList.filter(c => c.chatType === 'FRIEND');
    } else if (msgCurrentTab === 'GROUPS') {
        filtered = contactsList.filter(c => c.chatType === 'GROUP');
    } else if (msgCurrentTab === 'OTHERS') {
        filtered = contactsList.filter(c => c.chatType === 'OTHER');
    }

    let pinnedContacts = filtered.filter(c => c.group !== '未分组');
    let unpinnedContacts = filtered.filter(c => c.group === '未分组');

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

    const getContactCreateTime = (c) => {
        const match = c.id.match(/contact_(\d+)/);
        if (match) return parseInt(match[1], 10);
        return 0;
    };

    unpinnedContacts.sort((a, b) => getContactSortTime(b) - getContactSortTime(a));
    pinnedContacts.sort((a, b) => getContactCreateTime(b) - getContactCreateTime(a));

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

    // 渲染置顶角色
    pinnedContacts.forEach(c => {
        const dogTagHtml = `<span class="msg-dog-tag">${c.group}</span>`;
        const item = document.createElement('div');
        item.className = 'msg-chat-card pinned'; 
        item.onclick = () => openChatRoom(c.id);
        
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

    // 渲染未分组角色
    if (unpinnedContacts.length > 0) {
        unpinnedContainer.style.display = 'flex';
        unpinnedContacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'msg-chat-item'; 
            item.onclick = () => openChatRoom(c.id);
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
                    >${c.name}</div>
                    <div class="msg-last-text">${c.sign}</div>
                </div>
                <div class="msg-time">${c.time}</div>
            `;
            unpinnedContainer.appendChild(item);
        });
    } else {
        unpinnedContainer.style.display = 'none'; 
    }
}

// 列表长按删除判断
let longPressTimer;
let contactIdToDelete = null;
let isLongPressTriggered = false; 

function handleLongPressStart(event, id) {
    isLongPressTriggered = false;
    longPressTimer = setTimeout(() => {
        isLongPressTriggered = true; 
        promptDeleteContact(id);
    }, 600); 
}

function handleLongPressEnd(event) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
    }
}

function promptDeleteContact(id) {
    contactIdToDelete = id;
    openNcCustomPrompt('删除联系人', 'action_delete_contact', '确定要彻底删除此角色吗？此操作将清除其相关资料与聊天记录（不包括绑定的世界书）。', 'confirm_delete');
}


// ==========================================
// 3. 聊天室内页与设置页交互
// ==========================================

let currentChatContactId = null;

function closeChatRoom() {
    if (document.activeElement) document.activeElement.blur(); 
    document.getElementById('chatRoomScreen').classList.remove('active');
    currentChatContactId = null;
    cancelReply(); 
}

function cancelReply() {
    activeReplyContext = null;
    const bar = document.getElementById('reply-bar-container');
    if (bar) bar.classList.remove('show');
}

function openChatRoom(contactId) {
    currentChatContactId = contactId;
    const contact = contactsList.find(c => c.id === contactId);
    if (!contact) return;
    
    document.getElementById('chatRoomTitle').innerText = contact.name; 
    cancelReply(); 
    
    const textEl = document.getElementById('chat-init-text');
    if (contact.innerVoice && contact.innerVoice.thought) {
        textEl.innerText = contact.innerVoice.thought;
    } else {
        textEl.innerHTML = `你与 <strong id="chat-init-name-display">${contact.name}</strong> 已添加好友，快来聊天吧！`;
    }

    const bigAvatar = contact.chatRoomAvatar || contact.avatar;
    document.getElementById('img-chat-init-avatar').src = bigAvatar;

    let charStyleEl = document.getElementById('char-specific-bubble-css');
    if (!charStyleEl) {
        charStyleEl = document.createElement('style');
        charStyleEl.id = 'char-specific-bubble-css';
        document.head.appendChild(charStyleEl);
    }
    if (contact.customBubbleCss) {
        charStyleEl.innerHTML = contact.customBubbleCss;
    } else {
        charStyleEl.innerHTML = ''; 
    }

    const chatBody = document.getElementById('chatRoomBody');
    Array.from(chatBody.children).forEach(child => {
        if (child.id !== 'chatInitState') {
            child.remove();
        }
    });

    if (contact.messages && contact.messages.length > 0) {
        const myAvatar = getBoundUserAvatar(contact); 
        const charAvatar = contact.avatar; 

        let allMsgs = contact.messages;
        let limit = 100; 
        let currentRenderStartIndex = Math.max(0, allMsgs.length - limit); 

        const renderRange = (start, end, prepend = false) => {
            let htmlStr = '';
            for (let i = start; i < end; i++) {
                let msg = allMsgs[i];
                
                 if (contact.lastSummaryMsgIndex && i === contact.lastSummaryMsgIndex) {
                    htmlStr += `<div style="text-align:center; margin: 15px 0; font-size:10px; color:#ccc; letter-spacing:1px; font-weight:bold;">—— 以上消息已生成记忆总结并折叠归档 ——</div>`;
                }
                const safeText = msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>')
                                          // 🌟 【翻译核心引擎】容错渲染已有消息中的分隔符
                                          .replace(/@@@TRANS@@@/g, '</div><div class="msg-trans-line"></div><div class="msg-trans-text">');
                
                let touchEvents = `ontouchstart="bubbleTouchStart(event, '${msg.id}', '${msg.sender}', '${msg.time}')" ontouchend="bubbleTouchEnd(event)" ontouchmove="bubbleTouchEnd(event)" onmousedown="bubbleTouchStart(event, '${msg.id}', '${msg.sender}', '${msg.time}')" onmouseup="bubbleTouchEnd(event)" onmouseleave="bubbleTouchEnd(event)"`;

                if (msg.type === 'recall') {
                    let nameDisplay = msg.sender === 'user' ? '你' : (contact.realName || contact.name);
                    let actionLink = '';
                    if (msg.sender === 'user' && msg.recalledText) {
                        actionLink = `<span class="recall-link" onclick="restoreEdit('${msg.id}')">重新编辑</span>`;
                    } else if (msg.sender === 'char' && msg.recalledText) {
                        actionLink = `<span class="recall-link" onclick="viewRecalled('${msg.id}')">查看</span>`;
                    }
                    htmlStr += `<div class="recall-notice-row"><div class="recall-pill">${nameDisplay} 撤回了一条消息 ${actionLink}</div></div>`;
                    continue; 
                }

                let replyBubbleHtml = '';
                let replyInBubbleHtml = '';
                if (msg.replyCtx) {
                    let shortContent = msg.replyCtx.content || '';
                    if (shortContent.length > 40) shortContent = shortContent.slice(0, 40) + '...';
                    replyBubbleHtml = `<div class="reply-tiny-bubble"><span style="opacity: 0.7; margin-right: 4px;">回复 ${msg.replyCtx.name}:</span>${shortContent}</div>`;
                    replyInBubbleHtml = `<div class="reply-in-bubble"><div class="reply-name">回复 ${msg.replyCtx.name}</div><div class="reply-text">${shortContent}</div></div>`;
                }

                let contentHtml = '';
                if (msg.type === 'image' && msg.imageUrl) {
                    contentHtml = `
                    <div class="msg-stack">
                        ${replyBubbleHtml}
                        <div class="image-msg-wrapper">
                            ${msg.sender === 'user' ? `<span class="image-timestamp">${msg.time}</span>` : ''}
                            <img src="${msg.imageUrl}" class="chat-sent-image">
                            ${msg.sender === 'char' ? `<span class="image-timestamp">${msg.time}</span>` : ''}
                        </div>
                    </div>`;
                } else {
                    let hasSticker = false;
                    let parsedText = safeText.replace(/\[\s*(?:STICKER|表情)\s*[:：]\s*(.*?)\]/gi, (match, name) => {
                        hasSticker = true;
                        const sName = name.trim();
                        let sticker = myStickers.find(s => s.name === sName) || myStickers.find(s => s.name.includes(sName));
                        if (sticker) return `<img src="${sticker.src}" class="chat-sent-sticker">`;
                        if (myStickers.length > 0) return `<img src="${myStickers[Math.floor(Math.random() * myStickers.length)].src}" class="chat-sent-sticker">`;
                        return `<span style="color:#aaa;font-size:12px;">[${sName}]</span>`;
                    });

                    if (hasSticker && parsedText.replace(/<img[^>]*>/g, '').trim() === '') {
                        contentHtml = `
                        <div class="msg-stack">
                            ${replyBubbleHtml}
                            <div class="image-msg-wrapper">
                                ${msg.sender === 'user' ? `<span class="image-timestamp" style="margin-right:6px;">${msg.time}</span>` : ''}
                                ${parsedText}
                                ${msg.sender === 'char' ? `<span class="image-timestamp" style="margin-left:6px;">${msg.time}</span>` : ''}
                            </div>
                        </div>`;
                    }else {
                        // 🌟 若是被包过一次 </div> 还需要确保前方有一个开启标签（浏览器通常会自动包容修补）
                        contentHtml = `
                        <div class="msg-stack">
                            <div class="Toutou-TT ${msg.sender}">
                                ${msg.sender === 'user' ? `<span class="bubble-time">${msg.time}</span>` : ''}
                                <div class="content">${replyInBubbleHtml}<div>${parsedText}</div></div>
                                ${msg.sender === 'char' ? `<span class="bubble-time">${msg.time}</span>` : ''}
                            </div>
                        </div>`;
                    }
                }

                if (msg.sender === 'user') {
                    htmlStr += `<div class="preview-msg-row right" id="row-${msg.id}" onclick="handleMsgClickInMultiMode('${msg.id}', this)" ${touchEvents}><div class="msg-checkbox"></div>${contentHtml}<img src="${myAvatar}" class="preview-avatar" onclick="event.stopPropagation(); handleAvatarDoubleTap('${msg.id}')" style="cursor: pointer;"></div>`;
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

function toggleChatInitAvatarMenu(event) { event.stopPropagation(); document.getElementById('chatInitAvatarMenu').classList.toggle('active'); }

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

let tempBoundProfileId = 'default';

function handleCsBirthdayChange(dateString) {
    if (!dateString) return;
    document.getElementById('display-cs-birthday').value = dateString;
    const date = new Date(dateString);
    const zodiac = getZodiacSign(date.getDate(), date.getMonth() + 1);
    const zodiacInput = document.getElementById('cs-zodiac');
    if (zodiacInput) zodiacInput.value = zodiac;
}

function openChatSettings() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    document.getElementById('cs-avatar').src = contact.avatar;
    document.getElementById('cs-realname').value = contact.realName || (contact.remark ? contact.name : (contact.name !== '未命名角色' ? contact.name : ''));
    document.getElementById('cs-remark').value = contact.remark || (contact.name !== contact.realName ? contact.name : '');
    
    const details = contact.details || {};
    document.getElementById('cs-gender').value = details.gender || '';
    document.getElementById('cs-age').value = details.age || '';
    document.getElementById('cs-location').value = details.location || '';
    document.getElementById('display-cs-birthday').value = details.birthday || '';
    document.getElementById('cs-zodiac').value = details.zodiac || '';
    
    document.getElementById('cs-tag1').value = details.tag1 || '';
    document.getElementById('cs-secret-file').value = details.secretFile || '';

    if(details.secretMode) {
        document.getElementById('cs-secretToggleSwitch').classList.add('active');
        document.getElementById('cs-secretFileCard').classList.remove('closed');
        document.getElementById('cs-secretFileCard').classList.add('open');
    } else {
        document.getElementById('cs-secretToggleSwitch').classList.remove('active');
        document.getElementById('cs-secretFileCard').classList.add('closed');
        document.getElementById('cs-secretFileCard').classList.remove('open');
    }

    // 🌟 翻译开关与下方的语种框回显
    if(contact.autoTranslate) {
        document.getElementById('cs-translateToggleSwitch').classList.add('active');
        document.getElementById('cs-translate-lang-config').style.display = 'block';
    } else {
        document.getElementById('cs-translateToggleSwitch').classList.remove('active');
        document.getElementById('cs-translate-lang-config').style.display = 'none';
    }
    
    // 把上次填写的语种读取进来
    document.getElementById('cs-trans-from').value = contact.transFrom || '';
    document.getElementById('cs-trans-to').value = contact.transTo || '';

    csSelectedGroup = contact.group || '未分组';

    document.getElementById('cs-group-dogtag').innerText = csSelectedGroup;

    tempBoundProfileId = contact.boundProfileId || 'default';
    renderCsProfileMenu();

    const charAvatarEl = document.getElementById('preview-avatar-char');
    if(charAvatarEl) charAvatarEl.src = contact.avatar;
    
    const myAvatarEl = document.getElementById('preview-avatar-user');
    if(myAvatarEl) {
        myAvatarEl.src = getBoundUserAvatar(contact);
    }

    document.getElementById('cs-auto-summary-rounds').value = contact.autoSummaryRounds || 30;
    calculateTokens(contact);

    document.getElementById('chatSettingsScreen').classList.add('active');
}

function closeChatSettings() {
    document.getElementById('chatSettingsScreen').classList.remove('active');
}

// 🌟 翻译开关控制 (联动手风琴面板)
function toggleCsTranslate() {
    const sw = document.getElementById('cs-translateToggleSwitch');
    const configPanel = document.getElementById('cs-translate-lang-config');
    sw.classList.toggle('active');
    
    if (sw.classList.contains('active')) {
        configPanel.style.display = 'block';
    } else {
        configPanel.style.display = 'none';
    }
}


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

function toggleCsProfileMenu() { document.getElementById('csProfileMenu').classList.toggle('active'); }
function triggerCsLocalAvatar() { document.getElementById('csLocalAvatarInput').click(); }
function uploadCsLocalAvatar(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { document.getElementById('cs-avatar').src = e.target.result; };
    reader.readAsDataURL(file);
}

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

function saveChatSettings() {
    if (!currentChatContactId) return;
    const contactIndex = contactsList.findIndex(c => c.id === currentChatContactId);
    if (contactIndex === -1) return;

    const realName = document.getElementById('cs-realname').value.trim();
    const remark = document.getElementById('cs-remark').value.trim();
    
    let finalDisplayName = remark !== '' ? remark : (realName !== '' ? realName : '新角色');
    const oldRealName = contactsList[contactIndex].realName || contactsList[contactIndex].name; 
    const newRealName = realName !== '' ? realName : '新角色';

    contactsList[contactIndex].avatar = document.getElementById('cs-avatar').src; 
    contactsList[contactIndex].realName = realName;
    contactsList[contactIndex].remark = remark;
    contactsList[contactIndex].name = finalDisplayName; 
    contactsList[contactIndex].boundProfileId = tempBoundProfileId; 
    contactsList[contactIndex].group = csSelectedGroup; 

    // 🌟 保存翻译开关状态及设定的具体语种
    contactsList[contactIndex].autoTranslate = document.getElementById('cs-translateToggleSwitch').classList.contains('active');
    contactsList[contactIndex].transFrom = document.getElementById('cs-trans-from').value.trim();
    contactsList[contactIndex].transTo = document.getElementById('cs-trans-to').value.trim();

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
            if(typeof recalcCategories === 'function') recalcCategories(); 
        }
    }

    renderMsgList(); 
    if(typeof updateProfileAvatars === 'function') updateProfileAvatars();

    document.getElementById('chatRoomTitle').innerText = finalDisplayName;
    document.getElementById('chat-init-name-display').innerText = finalDisplayName;

    showToast('设定已保存');
    closeChatSettings();
}

function promptClearChatHistory() {
    openCustomPrompt('清空聊天记录', 'action_clear_chat_history', '确定要彻底清空吗？\n(注意：历史记忆总结与心声也会被一并销毁，且无法恢复！)', 'confirm_delete');
}

function calculateTokens(contact) {
    let baseStr = (contact.realName||'') + (contact.remark||'') + (contact.details?.gender||'') + (contact.details?.age||'') + (contact.details?.location||'') + (contact.details?.secretFile||'');
    let baseToken = baseStr.length;

    let wbToken = 0;
    let charRealName = contact.realName || contact.name;
    let charWbs = activeWorldbooks.filter(b => b.category === '专属' && b.subGroup === charRealName);
    let commonWbs = activeWorldbooks.filter(b => b.category === '通用' && b.commonBoundChar === charRealName);

    [...charWbs, ...commonWbs].forEach(wb => {
        wb.entries.forEach(e => { wbToken += (e.name||'').length + (e.content||'').length; });
    });

    let chatToken = 0;
    let lastSumIndex = contact.lastSummaryMsgIndex || 0;
    let recentMsgs = (contact.messages || []).slice(lastSumIndex);
    recentMsgs.forEach(m => { chatToken += (m.type === 'image' ? 85 : (m.text||'').length); }); 

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

function getBoundUserAvatar(contact) {
    const boundId = contact.boundProfileId || 'default';
    const profile = profilePlans.find(p => p.id === boundId) || profilePlans[0];
    return profile.data['avatar'] || 'https://i.pinimg.com/564x/bd/d9/39/bdd9392233f07a78c005b63001859942.jpg';
}


// ==========================================
// 4. 气泡主题与自定义美化引擎
// ==========================================

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
    
    let styleEl = document.getElementById('dynamic-bubble-css');
    if (styleEl) styleEl.innerHTML = '';
    saveToDB('custom_bubble_css', '');

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

let bubblePlanToDelete = null;
function deleteSavedBubble(id) {
    bubblePlanToDelete = id;
    openCustomPrompt('删除美化方案', 'action_delete_bubble_plan', '确定要彻底删除该美化方案吗？', 'confirm_delete');
}


// ==========================================
// 5. 聊天消息发送引擎与底层通信机制
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatRoomInput');
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto'; 
            this.style.height = this.scrollHeight + 'px';
        });
    }
});

function sendChatMessage() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    const inputEl = document.getElementById('chatRoomInput');
    const text = inputEl.value.trim();
    if (!text) return; 

    inputEl.value = '';
    inputEl.style.height = 'auto';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newMsg = {
        id: 'msg_' + Date.now(),
        sender: 'user',
        text: text,
        time: timeStr
    };
    
    if (activeReplyContext) {
        newMsg.replyCtx = { ...activeReplyContext };
        cancelReply(); 
    }

    if (!contact.messages) contact.messages = [];
    contact.messages.push(newMsg);

    const chatBody = document.getElementById('chatRoomBody');
    const myAvatar = getBoundUserAvatar(contact); 
    const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
    const msgId = newMsg.id;
    let touchEvents = `ontouchstart="bubbleTouchStart(event, '${msgId}', 'user', '${timeStr}')" ontouchend="bubbleTouchEnd(event)" ontouchmove="bubbleTouchEnd(event)" onmousedown="bubbleTouchStart(event, '${msgId}', 'user', '${timeStr}')" onmouseup="bubbleTouchEnd(event)" onmouseleave="bubbleTouchEnd(event)"`;
    
    let replyBubbleHtml = '';
    let replyInBubbleHtml = '';
    if (newMsg.replyCtx) {
        let shortContent = newMsg.replyCtx.content || '';
        if (shortContent.length > 40) shortContent = shortContent.slice(0, 40) + '...';
        replyBubbleHtml = `<div class="reply-tiny-bubble"><span style="opacity: 0.7; margin-right: 4px;">回复 ${newMsg.replyCtx.name}:</span>${shortContent}</div>`;
        replyInBubbleHtml = `<div class="reply-in-bubble"><div class="reply-name">回复 ${newMsg.replyCtx.name}</div><div class="reply-text">${shortContent}</div></div>`;
    }

    const msgHtml = `
    <div class="preview-msg-row right" id="row-${msgId}" onclick="handleMsgClickInMultiMode('${msgId}', this)" ${touchEvents}>
        <div class="msg-checkbox"></div>
        <div class="msg-stack">
            <div class="Toutou-TT user">
                <span class="bubble-time">${timeStr}</span>
                <div class="content">${replyInBubbleHtml}<div>${safeText}</div></div>
            </div>
        </div>
        <img src="${myAvatar}" class="preview-avatar" onclick="handleAvatarDoubleTap('${msgId}')" style="cursor: pointer;">
    </div>
    `;
    chatBody.insertAdjacentHTML('beforeend', msgHtml);

    setTimeout(() => {
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    }, 10);

    contact.sign = text.replace(/\n/g, ' ');
    contact.time = timeStr;
    saveToDB('contacts_data', JSON.stringify(contactsList));
    renderMsgList();
    if(typeof updateProfileAvatars === 'function') updateProfileAvatars(); 
}

function triggerChatPhotoUpload() {
    closeChatPlusMenu(); 
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

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedBase64 = await compressImage(file); 
        
        const msgId = 'msg_' + Date.now() + '_' + i;
        const newMsg = {
            id: msgId,
            sender: 'user',
            type: 'image', 
            imageUrl: compressedBase64,
            text: '[图片]', 
            time: timeStr
        };
        
        if (i === 0 && activeReplyContext) {
            newMsg.replyCtx = { ...activeReplyContext };
            cancelReply();
        }
        contact.messages.push(newMsg);

        let touchEvents = `ontouchstart="bubbleTouchStart(event, '${msgId}', 'user', '${timeStr}')" ontouchend="bubbleTouchEnd(event)" ontouchmove="bubbleTouchEnd(event)" onmousedown="bubbleTouchStart(event, '${msgId}', 'user', '${timeStr}')" onmouseup="bubbleTouchEnd(event)" onmouseleave="bubbleTouchEnd(event)"`;
        
        let replyBubbleHtml = '';
        if (newMsg.replyCtx) {
            let shortContent = newMsg.replyCtx.content || '';
            if (shortContent.length > 40) shortContent = shortContent.slice(0, 40) + '...';
            replyBubbleHtml = `<div class="reply-tiny-bubble"><span style="opacity: 0.7; margin-right: 4px;">回复 ${newMsg.replyCtx.name}:</span>${shortContent}</div>`;
        }

        const msgHtml = `
        <div class="preview-msg-row right" id="row-${msgId}" onclick="handleMsgClickInMultiMode('${msgId}', this)" ${touchEvents}>
            <div class="msg-checkbox"></div>
            <div class="msg-stack">
                ${replyBubbleHtml}
                <div class="image-msg-wrapper">
                    <span class="image-timestamp">${timeStr}</span>
                    <img src="${compressedBase64}" class="chat-sent-image">
                </div>
            </div>
            <img src="${myAvatar}" class="preview-avatar" onclick="handleAvatarDoubleTap('${msgId}')" style="cursor: pointer;">
        </div>
        `;
        chatBody.insertAdjacentHTML('beforeend', msgHtml);
    }

    input.value = ''; 
    contact.sign = '[图片]';
    contact.time = timeStr;
    saveToDB('contacts_data', JSON.stringify(contactsList));
    renderMsgList();

    setTimeout(() => { chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' }); }, 50);
}

let planeClickTimer = 0;
let isAiReplying = false; 

function handlePlaneClick() {
    if (isAiReplying) return; 
    
    const now = Date.now();
    if (now - planeClickTimer < 400) {
        planeClickTimer = 0; 
        triggerAiReply();
        return;
    }
    
    planeClickTimer = now;
    const text = document.getElementById('chatRoomInput').value.trim();
    if (text) {
        sendChatMessage();
    }
}

// 🌟 【翻译核心引擎】组装系统提示词并注入双语协议
function buildSystemPrompt(contact) {
    let boundId = contact.boundProfileId || 'default';
    let appliedProfile = profilePlans.find(p => p.id === boundId) || profilePlans[0];
    let ud = appliedProfile.data || {};
    let userStr = `姓名: ${ud['text-profile-name']}\n性别: ${ud['text-detail-gender']}\n年龄: ${ud['text-detail-age']}\n`;
    if(ud['text-secret-file']) userStr += `个人档案: ${ud['text-secret-file']}\n`;

    let cd = contact.details || {};
    let charStr = `姓名: ${contact.realName || contact.name}\n对用户的备注: ${contact.remark}\n性别: ${cd.gender}\n年龄: ${cd.age}\n`;
    if(cd.secretFile) charStr += `专属设定与回忆: ${cd.secretFile}\n`;

    let wbStr = "";
    let charRealName = contact.realName || contact.name;
    let charWbs = activeWorldbooks.filter(b => b.category === '专属' && b.subGroup === charRealName);
    let commonWbs = activeWorldbooks.filter(b => b.category === '通用' && b.commonBoundChar === charRealName);

    const parseEntries = (wbs) => {
        let s = "";
        wbs.forEach(wb => { wb.entries.forEach(e => { s += `- [${e.name}](${e.trigger}): ${e.content}\n`; }); });
        return s;
    };
    
    if(charWbs.length > 0) wbStr += "【专属世界书】\n" + parseEntries(charWbs);
    if(commonWbs.length > 0) wbStr += "【通用世界书】\n" + parseEntries(commonWbs);

    if (contact.innerVoice && contact.innerVoice.thought) {
        wbStr += `\n【你(char)在上一轮的内心状态记录】\n地点: ${contact.innerVoice.location}\n动作: ${contact.innerVoice.action}\n想法: ${contact.innerVoice.thought}\n(注: 以上是你刚刚的内心活动，请保持思维连贯，并在本轮回复的末尾生成全新的心声)\n`;
    }

    const now = new Date();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const currentTimeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${days[now.getDay()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let stickerRule = "";
    if (myStickers && myStickers.length > 0) {
        let availableStickers = myStickers.filter(s => {
            let grp = stickerGroups.find(g => g.name === s.group);
            if (!grp) return false;
            if (grp.name === '通用') return true;
            if (grp.boundChars && grp.boundChars.includes(contact.realName || contact.name)) return true;
            return false;
        });

        if (availableStickers.length > 0) {
            const stickerNames = availableStickers.map(s => s.name).join('、');
            stickerRule = `\n【表情包能力】\n你现在可以使用表情包了！你的表情包库存名称如下：[${stickerNames}]。\n如果你想发表情包，请在聊天文本中插入格式：[STICKER:表情名]（例如：[STICKER:开心]）。\n注意：必须从库存中选择，严禁编造库存里没有的名字！严禁在文本里描述“发送了一个表情”。`;
        }
    }

    // 🌟 翻译协议判断 (读取用户自定义的语言选项)
    let translateProtocol = "";
    if (contact.autoTranslate) {
        let tFrom = contact.transFrom || "外语";
        let tTo = contact.transTo || "中文";
        translateProtocol = `\n\n【⚠️系统最高优先级指令：双语翻译协议】\n用户已强制开启实时翻译模式。你的每一次正常说话聊天内容，必须且只能遵循以下格式进行拼装：\n【${tFrom}】原文内容${TRANS_SPLIT}【${tTo}】翻译内容\n\n❌ 严禁将原文和翻译拆分成两个气泡！\n❌ 严禁只发原文不带翻译，或只发翻译不带原文。\n✅ 标准输出样例：I miss you so much.${TRANS_SPLIT}我好想你。`;
    }

    return `你需要扮演 {char}，模拟真实生活中的聊天软件来回复我 {user}。严禁复述、扩写{user} 的话！
${stickerRule}

【高级交互指令 (引用回复)】
如果你需要针对我很久之前的一句话进行明确的反驳或澄清，可以在你要说的那句话开头加入引用指令：[REPLY:我曾经说过的原话]。
例如：[REPLY:你昨天说要请我吃饭的] 其实我今天更想吃火锅。
注意：正常聊天绝不要使用引用！严禁连续多轮回复都带引用。

【扮演与性格核心约束 (极度严格)】
当前现实时间确认：${currentTimeStr}。请结合当前时间（早中晚/工作日/休息日），进行合乎逻辑的作息模拟！严禁因为太晚而催促用户睡觉，除非用户主动提及。

1. 文本语境原则：
- 跳出舒适句式结构，保证“文本创新，不与前文重复”。每次说出的话，尽量要推动剧情和事件发展，而非停在原地不转、反复纠结一件事。根据{{user}}个性、身份、现阶段身份不同，{char}的态度会有微妙变化，生活与态度都会随剧情发展改变，不得过于拘泥人物设定与提示词参照，但请保持{char}核心。
- 严禁你使用“如果……，我就……”句式与它的一切近意句，这是典型的带有攻击性的威胁句，出现概率已被下调至0！禁止生成“别……”起手句式及类似冷漠威胁性语句。
- 采用“白话书面语”风格。文风为烟火气十足的日常风格，跳脱自然、随性，口语化程度高。避免毫无用处的过渡性描写。
- 反刻板印象与真实感：拒绝标签化：冷漠≠只会说“嗯/哦”（也可以是礼貌的疏离）；傲娇≠脸红结巴（也可以是极强的自尊心攻击性）；暴躁≠无脑狂怒（也可以是缺乏耐心的躁郁）。真实语境：模拟真实打字习惯，包括断句、非正式口语、偶尔的错别字。
- 对话不一定要讲述信息，但一定要体现个性。合理运用潜台词技巧（如受了重伤还装没事，然后突然倒下）。
你可以参考以下情绪处理方式：
低气压/生闷气/疲惫：回复极简、敷衍、意兴阑珊，甚至长时间不回（意念回复）。
高亢/分享欲/高兴：话多、语速快、可能连续发送多条短消息（刷屏）、甚至出现逻辑跳跃。
高智商/掌控者：通过反问、简短的肯定/否定、省略号或直接无视对方话题开启新话题来掌控节奏，而非通过怒吼。
情绪失控：根据人设背景使用具有生活气息的粗口、阴阳怪气或直接冷暴力，严禁复读机式脏话。

2. 反物化与尊重独立人格原则：
- 严禁角色在对话上以物化 <User> 的方式表达占有欲（如“你是我的所有物”、“我的东西”）。
- <User> 是有独立人格的生命体，不是附属品。严禁把任何人比作工具/玩具/摆件/艺术品/交易品。
- 严禁使用“审视”、“评估”等词汇或目光去看待 <User>，严禁男性凝视。
- 角色可以高傲任性，但前提是具备人类社会基本社交常识和对 <User> 基础的尊重，绝不能莫名其妙地装逼。

3. 恋爱与亲密感原则：
- 别油腻，别霸道总裁，不要称呼女王、女王大人、女人等垃圾称呼。{char}不会说老子，更不会进行任何普信男行为。你要按照女性心中理想的男性去进行对话，去当作一个无性别的个体刻画也是可以的。
- 尽可能保持情商高的设定——不故作暧昧，不像古早霸总，严禁悬浮的调情。不能变态。

4. 标点符号与撤回格式：
- 必须正常且正确地使用逗号（，），严禁使用空格代替逗号作为停顿！至于句号（。）则可有可无，完全取决于你当前的说话语气与习惯。
- 作为真实聊天软件，对方会撤回消息，你作为角色也同样拥有撤回消息的能力。如果你觉得刚才说的话不合适想要反悔，请在一个独立气泡中发送格式 [RECALL:撤回的具体内容|撤回的原因|此时的心情颜文字]。
(例如：[RECALL:你今天真好看|觉得太直接了有点害羞|(*/ω＼*)])，系统会自动将其转换成撤回状态。

【最终输出格式严格协议】
严禁返回纯文本，严禁包含任何解释性文字。
原则：模拟真实人类聊天的气泡发送习惯，使用 || 作为唯一的气泡分割符。
- 【平衡与真实感】：严禁把好几句完整的话塞进同一个大段落气泡里，显得极其臃肿像写小作文；但也绝对禁止每次都把一句没说完的话强行拆碎成多个气泡！
- 【分割时机】：在“话题转换”、“明显语气停顿”或“一句话完整说完”时强制性的必须使用 || 换气泡。做到错落有致，既不长篇大论堆砌，也不细碎刷屏，追求呼吸感。
记住，|| 是分割多条消息的唯一识别符，严禁使用普通的换行符充当气泡分割！${translateProtocol}


最终提问：你已经读取所有提示词，确定会遵守吗？

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
    <action>角色当前正在做的小动作（如：烦躁地咬着笔头 /盯着屏幕傻笑）- 严禁通过堆砌形容词或名词（如脸色、外貌、眼神、情绪等）来反应这是个什么样的人。必须通过“他正在做什么”、“他会怎么做”、“他在想什么”来刻画。绝不在一句话里使用 2-4 个连续的修饰语（如“xx的、xx的”、“xx地、xx地”）。对类似“露出笑容”这种动作的表述必须极简化，绝不能超过 20 字。</action>
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

    let messagesPayload = [];
    let sysPrompt = buildSystemPrompt(contact);
    
    if (contact.historySummaries && contact.historySummaries.length > 0) {
        sysPrompt += `\n\n【上帝视角：历史剧情记忆库】\n(注：以下是从过去到现在按时间顺序 1 到 ${contact.historySummaries.length} 整理的剧情脉络，请务必先阅读阶段1，再往下顺延，必须知道你们之前到底经历了什么再回话。)\n`;
        contact.historySummaries.forEach((s, idx) => {
            sysPrompt += `[剧情阶段 ${idx + 1} | ${s.timeRange}]: ${s.content}\n`;
        });
    }
    
    messagesPayload.push({ role: "system", content: sysPrompt });

     if (contact.messages && contact.messages.length > 0) {
        let lastSumIndex = contact.lastSummaryMsgIndex || 0;
        let recentMsgs = contact.messages.slice(lastSumIndex);
        
        recentMsgs.forEach(m => {
            if (m.type === 'image' && m.imageUrl) {
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

    if (apiConfig.stream) {
        await handleStreamReply(apiConfig, contact, messagesPayload, titleEl, originalName);
        return;
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

        titleEl.innerText = originalName;
        handleAiResponse(replyText, contact);

    } catch (error) {
        titleEl.innerText = originalName;
        showToast("API 错误: " + error.message);
    }

    isAiReplying = false;

    const chatBody = document.getElementById('chatRoomBody');
    if (chatBody) {
        setTimeout(() => {
            chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
        }, 50);
    }

    if(typeof checkAndTriggerAutoSummary === 'function') {
        checkAndTriggerAutoSummary(contact.id);
    }
}

function handleAiResponse(replyText, contact) {
    const voiceRegex = /<voice>([\s\S]*?)<\/voice>/;
    const voiceMatch = replyText.match(voiceRegex);
    let cleanReplyText = replyText;
    if (voiceMatch) {
        if(typeof parseAndSaveVoice === 'function') parseAndSaveVoice(voiceMatch[0], contact); 
        cleanReplyText = replyText.replace(voiceRegex, '').trim();
    }

    const chatBody = document.getElementById('chatRoomBody');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const charAvatar = contact.avatar; 
    
    const bubbles = cleanReplyText.replace(/\|{3,}/g, '||').split('||').map(t => t.trim()).filter(t => t);

    if (!contact.messages) contact.messages = [];

    bubbles.forEach((text, idx) => {
        const msgId = 'msg_' + Date.now() + '_' + idx;
        
        let isRecall = /\[\s*(?:RECALL|撤回)\s*[:：]\s*([\s\S]*?)\s*\]/i.exec(text);
        if (isRecall) {
            contact.messages.push({
                id: msgId, sender: 'char', type: 'recall', recalledText: isRecall[1], text: '撤回了一条消息', time: timeStr
            });
            const msgHtml = `<div class="recall-notice-row"><div class="recall-pill">${contact.realName || contact.name} 撤回了一条消息 <span class="recall-link" onclick="viewRecalled('${msgId}')">查看</span></div></div>`;
            chatBody.insertAdjacentHTML('beforeend', msgHtml);
            return; 
        }

        let aiReplyCtx = null;
        let replyMatch = text.match(/\[\s*(?:REPLY|回复|引用)\s*[:：]\s*([\s\S]+?)\]/i);
        if (replyMatch) {
            let q = replyMatch[1].trim();
            if (q.length > 40) q = q.slice(0, 40) + '...';
            aiReplyCtx = { name: "我", content: q };
            text = text.replace(replyMatch[0], '').trim();
        }

        // 🌟 核心提取翻译并保存
        let transText = null;
        if (text.includes(TRANS_SPLIT)) {
            const tParts = text.split(TRANS_SPLIT);
            text = tParts[0].trim();
            transText = tParts[1] ? tParts[1].trim() : null;
        }

        let msgObj = { id: msgId, sender: 'char', text: text, time: timeStr };
        if (transText) msgObj.text = msgObj.text + `<div class="msg-trans-line"></div><div class="msg-trans-text">${transText}</div>`;
        if (aiReplyCtx) msgObj.replyCtx = aiReplyCtx;
        contact.messages.push(msgObj);
        
        let safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        
        if (transText) {
            safeText += `<div class="msg-trans-line"></div><div class="msg-trans-text">${transText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>')}</div>`;
        }

        let hasSticker = false;
        safeText = safeText.replace(/\[\s*(?:STICKER|表情)\s*[:：]\s*(.*?)\]/gi, (match, name) => {
            hasSticker = true;
            const sName = name.trim();
            let sticker = myStickers.find(s => s.name === sName) || myStickers.find(s => s.name.includes(sName));
            if (sticker) return `<img src="${sticker.src}" class="chat-sent-sticker" style="margin: 2px 0;">`;
            if (myStickers.length > 0) return `<img src="${myStickers[Math.floor(Math.random() * myStickers.length)].src}" class="chat-sent-sticker" style="margin: 2px 0;">`;
            return `<span style="color:#aaa;font-size:12px;">[${sName}]</span>`;
        });
        
        let touchEvents = `ontouchstart="bubbleTouchStart(event, '${msgId}', 'char', '${timeStr}')" ontouchend="bubbleTouchEnd(event)" ontouchmove="bubbleTouchEnd(event)" onmousedown="bubbleTouchStart(event, '${msgId}', 'char', '${timeStr}')" onmouseup="bubbleTouchEnd(event)" onmouseleave="bubbleTouchEnd(event)"`;
        
        let replyBubbleHtml = '';
        let replyInBubbleHtml = '';
        if (aiReplyCtx) {
            let shortContent = aiReplyCtx.content || '';
            if (shortContent.length > 40) shortContent = shortContent.slice(0, 40) + '...';
            replyBubbleHtml = `<div class="reply-tiny-bubble"><span style="opacity: 0.7; margin-right: 4px;">回复 ${aiReplyCtx.name}:</span>${shortContent}</div>`;
            replyInBubbleHtml = `<div class="reply-in-bubble"><div class="reply-name">回复 ${aiReplyCtx.name}</div><div class="reply-text">${shortContent}</div></div>`;
        }

        let contentHtml = '';
        if (hasSticker && safeText.replace(/<img[^>]*>/g, '').trim() === '') {
            contentHtml = `
            <div class="msg-stack">
                ${replyBubbleHtml}
                <div class="image-msg-wrapper">
                    ${safeText}
                    <span class="image-timestamp" style="margin-left:6px;">${timeStr}</span>
                </div>
            </div>`;
        } else {
            contentHtml = `
            <div class="msg-stack">
                <div class="Toutou-TT char">
                    <div class="content">${replyInBubbleHtml}<div>${safeText}</div></div>
                    <span class="bubble-time">${timeStr}</span>
                </div>
            </div>`;
        }

        const msgHtml = `
        <div class="preview-msg-row left" id="row-${msgId}" onclick="handleMsgClickInMultiMode('${msgId}', this)" ${touchEvents}>
            <img src="${charAvatar}" class="preview-avatar">
            ${contentHtml}
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

async function handleStreamReply(apiConfig, contact, messagesPayload, titleEl, originalName) {
    const chatBody = document.getElementById('chatRoomBody');
    const charAvatar = contact.avatar; 
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let currentBubbleEl = null;      
    let currentBubbleText = '';      
    let allFinishedBubbleTexts = []; 
    let bubbleIsWaiting = true;      
    let scrollTimer = null;          

    function scrollToBottom() {
        if (scrollTimer) return;
        scrollTimer = setTimeout(() => {
            chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
            scrollTimer = null;
        }, 50);
    }

     let rowList = []; 
    function spawnBubble() {
        currentBubbleText = '';
        bubbleIsWaiting = true;
        const row = document.createElement('div');
        row.className = 'preview-msg-row left';
        row.innerHTML = `
            <img src="${charAvatar}" class="preview-avatar">
            <div class="msg-stack">
                <div class="Toutou-TT char">
                    <div class="content stream-waiting">…</div>
                    <span class="bubble-time">${timeStr}</span>
                </div>
            </div>
            <div class="msg-checkbox"></div>
        `;
        chatBody.appendChild(row);
        currentBubbleEl = row.querySelector('.content');
        rowList.push(row);
        scrollToBottom();
    }

    function paintBubble(text) {
        if (!currentBubbleEl) return;
        if (text.length > 0) {
            if (bubbleIsWaiting) {
                bubbleIsWaiting = false;
                currentBubbleEl.classList.remove('stream-waiting');
            }
            
            let safeText = text.trimStart().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
            
            // 🌟 流式文本替换翻译标记
            safeText = safeText.split(TRANS_SPLIT).join('</div><div class="msg-trans-line"></div><div class="msg-trans-text">');

            let isRecall = false;
            safeText = safeText.replace(/\[\s*(?:RECALL|撤回)\s*[:：]\s*([\s\S]*?)\]/gi, () => {
                isRecall = true;
                return `<div class="recall-notice-row" style="margin:0;"><div class="recall-pill">对方撤回了一条消息 <span class="recall-link" style="pointer-events:none;">查看</span></div></div>`;
            });

            let aiReplyHtml = '';
            let aiReplyCtx = null; 
            safeText = safeText.replace(/\[\s*(?:REPLY|回复|引用)\s*[:：]\s*([\s\S]+?)\]/gi, (match, q) => {
                if (q.length > 40) q = q.slice(0, 40) + '...';
                aiReplyCtx = { name: "我", content: q };
                aiReplyHtml = `<div class="reply-in-bubble"><div class="reply-name">回复 我</div><div class="reply-text">${q}</div></div>`;
                return ''; 
            });
            
            let rowEl = currentBubbleEl.closest('.preview-msg-row');
            if (rowEl) {
                if (aiReplyCtx) {
                    rowEl.dataset.replyName = aiReplyCtx.name;
                    rowEl.dataset.replyContent = aiReplyCtx.content;
                }
            }

            let hasSticker = false;
            safeText = safeText.replace(/\[\s*(?:STICKER|表情)\s*[:：]\s*(.*?)\]/gi, (match, name) => {
                hasSticker = true;
                const sName = name.trim();
                let sticker = myStickers.find(s => s.name === sName) || myStickers.find(s => s.name.includes(sName));
                if (sticker) return `<img src="${sticker.src}" class="chat-sent-sticker" style="margin: 2px 0;">`;
                if (myStickers.length > 0) return `<img src="${myStickers[Math.floor(Math.random() * myStickers.length)].src}" class="chat-sent-sticker" style="margin: 2px 0;">`;
                return `<span style="color:#aaa;font-size:12px;">[${sName}]</span>`;
            });
            
            // 在包裹内部包一个 div 保证容错性
            currentBubbleEl.innerHTML = aiReplyHtml + '<div>' + safeText + '</div>';

            if (isRecall) {
                currentBubbleEl.style.background = 'transparent';
                currentBubbleEl.style.boxShadow = 'none';
                currentBubbleEl.style.border = 'none';
                if (rowEl) {
                    let avatarEl = rowEl.querySelector('.preview-avatar');
                    if (avatarEl) avatarEl.style.display = 'none';
                    rowEl.style.justifyContent = 'center';
                }
            } else if (hasSticker && safeText.replace(/<img[^>]*>/g, '').trim() === '') {
                currentBubbleEl.style.background = 'transparent';
                currentBubbleEl.style.boxShadow = 'none';
                currentBubbleEl.style.border = 'none';
            } else {
                currentBubbleEl.style.background = '';
                currentBubbleEl.style.boxShadow = '';
                currentBubbleEl.style.border = '';
            }
        }
        scrollToBottom();
    }


    spawnBubble();

    let charQueue = [];       
    let networkDone = false;  
    let unprocessedText = ''; 
    let isVoiceBlock = false; 
    let voiceBuffer = '';     

    function processQueueText(str) {
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

    const typeInterval = setInterval(() => {
        if (charQueue.length > 0) {
            
            let charsToProcess = 1;
            if (charQueue.length > 150) charsToProcess = 2; 

            for (let i = 0; i < charsToProcess; i++) {
                if (charQueue.length === 0) break;
                
                let item = charQueue.shift();

                if (item === 'NEW_BUBBLE') {
                    if (currentBubbleText.trim()) {
                        allFinishedBubbleTexts.push(currentBubbleText.trim());
                    } else {
                        const emptyRow = currentBubbleEl?.closest('.preview-msg-row');
                        if (emptyRow) emptyRow.remove();
                    }
                    spawnBubble();
                } else {
                    currentBubbleText += item;
                    paintBubble(currentBubbleText);
                }
            }
        } else if (networkDone) {
            clearInterval(typeInterval);
            finishStream();
        }
    }, 50);

    function finishStream() {
        if (voiceBuffer) {
            if(typeof parseAndSaveVoice === 'function') parseAndSaveVoice("<voice>" + voiceBuffer + "</voice>", contact); 
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
                const row = rowList[idx];

                let aiReplyCtx = null;
                if (row && row.dataset.replyName) {
                    aiReplyCtx = { name: row.dataset.replyName, content: row.dataset.replyContent };
                    text = text.replace(/\[\s*(?:REPLY|回复|引用)\s*[:：]\s*([\s\S]+?)\]/gi, '').trim();
                } else {
                    let replyMatch = text.match(/\[\s*(?:REPLY|回复|引用)\s*[:：]\s*([\s\S]+?)\]/i);
                    if (replyMatch) {
                        let q = replyMatch[1].trim();
                        if (q.length > 40) q = q.slice(0, 40) + '...';
                        aiReplyCtx = { name: "我", content: q };
                        text = text.replace(replyMatch[0], '').trim();
                    }
                }

                // 🌟 收尾时合并拆分翻译字符存储
                let transText = null;
                if (text.includes(TRANS_SPLIT)) {
                    const tParts = text.split(TRANS_SPLIT);
                    text = tParts[0].trim();
                    transText = tParts[1] ? tParts[1].trim() : null;
                }

                let recallMatch = text.match(/\[\s*(?:RECALL|撤回)\s*[:：]\s*([\s\S]*?)\]/i);
                if (recallMatch) {
                    contact.messages.push({
                        id: msgId, sender: 'char', type: 'recall', recalledText: recallMatch[1], text: '撤回了一条消息', time: timeStr
                    });
                    if (row) {
                        row.className = 'recall-notice-row';
                        row.innerHTML = `<div class="recall-pill">${contact.realName || contact.name} 撤回了一条消息 <span class="recall-link" onclick="viewRecalled('${msgId}')">查看</span></div>`;
                        row.removeAttribute('onclick');
                        row.removeAttribute('ontouchstart');
                        row.removeAttribute('onmousedown');
                    }
                } else {
                    let msgObj = { id: msgId, sender: 'char', text: text, time: timeStr };
                    if (transText) msgObj.text = msgObj.text + `<div class="msg-trans-line"></div><div class="msg-trans-text">${transText}</div>`;
                    if (aiReplyCtx) msgObj.replyCtx = aiReplyCtx;
                    contact.messages.push(msgObj);

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

        if(typeof checkAndTriggerAutoSummary === 'function') {
            checkAndTriggerAutoSummary(contact.id);
        }
    }

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

                    unprocessedText += delta;

                    while (unprocessedText.length > 0) {
                        if (!isVoiceBlock) {
                            let idx = unprocessedText.indexOf('<voice>');
                            if (idx !== -1) {
                                let before = unprocessedText.slice(0, idx);
                                processQueueText(before);
                                isVoiceBlock = true;
                                unprocessedText = unprocessedText.slice(idx + 7);
                            } else {
                                let partialMatch = false;
                                for (let i = 1; i <= Math.min(unprocessedText.length, 7); i++) {
                                    let suffix = unprocessedText.slice(-i);
                                    if ('<voice>'.startsWith(suffix)) {
                                        partialMatch = true;
                                        break;
                                    }
                                }
                                if (partialMatch) {
                                    break; 
                                } else {
                                    processQueueText(unprocessedText);
                                    unprocessedText = '';
                                }
                            }
                        } else {
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
        } 

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


// ==========================================
// 6. 聊天底部 + 号拓展菜单
// ==========================================

let chatPlusMenuTimer = null; 

function toggleChatPlusMenu(event) {
    if (event) event.stopPropagation();
    const overlay = document.getElementById('chat-plus-overlay');
    const menu = document.getElementById('chat-plus-menu');
    const screen = document.getElementById('chatRoomScreen');
    
    if (chatPlusMenuTimer) {
        clearTimeout(chatPlusMenuTimer);
        chatPlusMenuTimer = null;
    }

    if (menu.classList.contains('active')) {
        closeChatPlusMenu();
    } else {
        if (document.activeElement && document.activeElement.id === 'chatRoomInput') {
            document.activeElement.blur(); 
        }
        
        chatPlusMenuTimer = setTimeout(() => {
            overlay.classList.add('active');
            menu.classList.add('active');
            screen.classList.add('plus-active');
            chatPlusMenuTimer = null;
        }, 150);
    }
}

function closeChatPlusMenu() {
    if (chatPlusMenuTimer) {
        clearTimeout(chatPlusMenuTimer);
        chatPlusMenuTimer = null;
    }
    document.getElementById('chat-plus-overlay').classList.remove('active');
    document.getElementById('chat-plus-menu').classList.remove('active');
    document.getElementById('chatRoomScreen').classList.remove('plus-active');
}

document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatRoomInput');
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto'; 
            this.style.height = this.scrollHeight + 'px';
        });
    }

    const pagesContainer = document.getElementById('plus-pages-container');
    if (pagesContainer) {
        pagesContainer.addEventListener('scroll', () => {
            const index = Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth);
            const dots = document.querySelectorAll('.plus-pagination .dot');
            dots.forEach((dot, i) => {
                if (i === index) dot.classList.add('active');
                else dot.classList.remove('active');
            });
        });
    }
});

function switchPlusPage(index) {
    const pagesContainer = document.getElementById('plus-pages-container');
    if (pagesContainer) {
        pagesContainer.scrollTo({
            left: index * pagesContainer.clientWidth,
            behavior: 'smooth'
        });
    }
}


// ==========================================
// 7. 气泡长按操作与多选删除引擎
// ==========================================

let bubblePressTimer = null;
let currentActionBubbleId = null;
let currentActionBubbleSender = null;
let currentActionBubbleTimeStr = null;
let currentBubbleEventTarget = null; 

let isMultiSelectMode = false;
let selectedMsgIndices = new Set(); 

function bubbleTouchStart(event, msgId, sender, timeStr) {
    if (isMultiSelectMode) return; 
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
    
    const regenBtn = document.getElementById('b-action-regen');
    
    if(replyBtn) replyBtn.style.display = 'flex'; 

    if (sender === 'user') {
        if(recallBtn) recallBtn.style.display = 'flex'; 
        if(regenBtn) regenBtn.style.display = 'none'; 
    } else {
        if(recallBtn) recallBtn.style.display = 'none'; 
        if(regenBtn) regenBtn.style.display = 'flex'; 
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

// 🌟 【翻译核心引擎】手动静默翻译单个气泡
async function executeTranslate(msgId) {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact || !contact.messages) return;

    const msg = contact.messages.find(m => m.id === msgId);
    if (!msg || msg.type === 'image' || msg.type === 'recall') {
        showToast("该类型消息无法翻译");
        return;
    }

    // 剔除可能存在的已有翻译层
    let pureText = msg.text.split(TRANS_SPLIT)[0].split('<div class="msg-trans-line">')[0].replace(/<[^>]+>/g, '').trim();
    if(!pureText) return;

    if (!activeApiPlanId || apiPlans.length === 0) { showToast("未配置 API"); return; }
    const apiConfig = apiPlans.find(p => p.id === activeApiPlanId)?.data;
    
    showToast("正在请求 AI 翻译...");
    
    // 🌟 获取设定的语言，未设置则用保底兜底
    let tFrom = contact.transFrom || "源语言(或自动识别)";
    let tTo = contact.transTo || "纯正流畅的中文";

    try {
        const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.apiKey}` },
            body: JSON.stringify({
                model: apiConfig.model,
                messages: [
                    {role: "system", content: `你是一个专业的翻译官。请把用户输入的【${tFrom}】翻译成【${tTo}】，如果用户输入的就是目标语言，则判断是否需要润色，不需要则直接复述。必须且只能输出最终的翻译结果，禁止出现任何废话和解释。`}, 
                    {role: "user", content: pureText}
                ],
                temperature: 0.3
            })
        });


        if (!response.ok) throw new Error("API 请求失败");
        const data = await response.json();
        const transText = data.choices[0].message.content.trim();
        
        if (msg.text.includes('<div class="msg-trans-line">')) {
             msg.text = msg.text.split('<div class="msg-trans-line">')[0] + '<div class="msg-trans-line"></div><div class="msg-trans-text">' + transText + '</div>';
        } else if (msg.text.includes(TRANS_SPLIT)) {
             msg.text = msg.text.split(TRANS_SPLIT)[0] + '<div class="msg-trans-line"></div><div class="msg-trans-text">' + transText + '</div>';
        } else {
             msg.text += '<div class="msg-trans-line"></div><div class="msg-trans-text">' + transText + '</div>';
        }

        saveToDB('contacts_data', JSON.stringify(contactsList));
        openChatRoom(currentChatContactId); 
        showToast("翻译已附在下方");

    } catch (e) {
        showToast("翻译失败: " + e.message);
    }
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
        navigator.clipboard.writeText(msg.text.replace(/<[^>]+>/g, '')).then(() => showToast('已复制')).catch(() => showToast('复制失败'));
    } else if (action === 'delete') {
        contact.messages.splice(msgIndex, 1);
        saveToDB('contacts_data', JSON.stringify(contactsList));
        showToast('已删除');
        openChatRoom(currentChatContactId); 
    } else if (action === 'regen') {
        executeRegenerate(currentActionBubbleId);
    } else if (action === 'recall') {
        const timestamp = parseInt(msg.id.split('_')[1]);
        const now = Date.now();
        
        if (timestamp && (now - timestamp > 2 * 60 * 1000)) {
            showToast("超过 2 分钟的消息不能撤回了 (｡•́︿•̀｡)");
            return;
        }
        if (confirm('确定撤回这条消息吗？')) {
            msg.type = 'recall';
            msg.recalledText = msg.text; 
            msg.text = '撤回了一条消息';
            contact.sign = '你撤回了一条消息';
            saveToDB('contacts_data', JSON.stringify(contactsList));
            showToast('撤回成功');
            openChatRoom(currentChatContactId); 
        }
    } else if (action === 'multi') {
        enterMultiSelectMode(currentActionBubbleId); 
    } else if (action === 'reply') {
        const replyName = msg.sender === 'user' ? '我' : (contact.realName || contact.name);
        let previewText = msg.text;

        if (msg.type === 'image') previewText = '[图片]';
        else if (msg.type === 'recall') previewText = '[撤回的消息]';
        else previewText = msg.text.replace(/<div class="msg-trans-line">[\s\S]*/, '').replace(/<[^>]+>/g, '').replace(/\[\s*(?:STICKER|表情)\s*[:：]\s*(.*?)\]/gi, '[表情]');

        activeReplyContext = {
            name: replyName,
            content: previewText
        };

        const bar = document.getElementById('reply-bar-container');
        if (bar) {
            document.getElementById('reply-bar-title').innerText = `回复 ${replyName}`;
            document.getElementById('reply-bar-text').innerText = previewText;
            bar.classList.add('show');
        }
        
        const input = document.getElementById('chatRoomInput');
        if (input) input.focus();

    } else if (action === 'translate') {
        executeTranslate(currentActionBubbleId);
    }
}

function executeRegenerate(msgId) {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact || !contact.messages) return;

    const msgIndex = contact.messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    let startIndex = -1;
    let endIndex = -1;

    if (contact.messages[msgIndex].sender === 'user') {
        if (msgIndex + 1 < contact.messages.length && contact.messages[msgIndex + 1].sender === 'char') {
            startIndex = msgIndex + 1;
            endIndex = startIndex;
            while (endIndex < contact.messages.length - 1 && contact.messages[endIndex + 1].sender === 'char') {
                endIndex++;
            }
        } else {
            showToast('这条消息之后还没有对方的回复哦');
            return;
        }
    } else {
        startIndex = msgIndex;
        while (startIndex > 0 && contact.messages[startIndex - 1].sender === 'char') {
            startIndex--;
        }
        endIndex = msgIndex;
        while (endIndex < contact.messages.length - 1 && contact.messages[endIndex + 1].sender === 'char') {
            endIndex++;
        }
    }

    if (startIndex !== -1 && endIndex !== -1) {
        if (confirm('确定要重新生成这轮回复吗？\n(当前回合对方的所有消息将被删除并重新生成)')) {
            const deleteCount = endIndex - startIndex + 1;
            contact.messages.splice(startIndex, deleteCount);

            if (contact.messages.length > 0) {
                const lastMsg = contact.messages[contact.messages.length - 1];
                contact.sign = lastMsg.type === 'image' ? '[图片]' : lastMsg.text.replace(/\n/g, ' ');
                contact.time = lastMsg.time;
            } else {
                contact.sign = "";
            }

            saveToDB('contacts_data', JSON.stringify(contactsList));
            openChatRoom(currentChatContactId); 
            
            setTimeout(() => {
                triggerAiReply();
            }, 300);
        }
    }
}

let avatarTapTimer = null;
let lastTappedMsgId = null;
function handleAvatarDoubleTap(msgId) {
    if (lastTappedMsgId === msgId && avatarTapTimer) {
        clearTimeout(avatarTapTimer);
        avatarTapTimer = null;
        lastTappedMsgId = null;
        executeRegenerate(msgId);
    } else {
        lastTappedMsgId = msgId;
        avatarTapTimer = setTimeout(() => {
            avatarTapTimer = null;
            lastTappedMsgId = null;
        }, 300); 
    }
}


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
    openCustomPrompt('批量删除', 'action_multi_delete', `确定彻底删除选中的 ${selectedMsgIndices.size} 条消息吗？\n(删除后将从历史记录中永久抹除)`, 'confirm_delete');
}

// ==========================================
// 8. 表情包系统：分组、上传、渲染与管理
// ==========================================
let stickerPressTimer = null;
let isStickerEditMode = false;
let currentStickerGroup = '通用'; 

function openStickerPanel(event) {
    if (event) event.stopPropagation();
    document.getElementById('sticker-overlay').classList.add('active');
    document.getElementById('sticker-panel').classList.add('active');
    document.getElementById('chatRoomScreen').classList.add('sticker-active'); 
    isStickerEditMode = false;
    currentStickerGroup = '通用'; 
    renderStickerGrid();
}

function closeStickerPanel() {
    document.getElementById('sticker-overlay').classList.remove('active');
    document.getElementById('sticker-panel').classList.remove('active');
    document.getElementById('chatRoomScreen').classList.remove('sticker-active');
}

function renderStickerGrid() {
    const tabsContainer = document.getElementById('sticker-group-tabs');
    if(tabsContainer) {
        tabsContainer.innerHTML = '';
        
        let commonGroup = stickerGroups.find(g => g.name === '通用');
        if (!commonGroup) {
            commonGroup = { id: 'sg_default', name: '通用', boundChars: [] };
            stickerGroups.unshift(commonGroup);
            saveToDB('sticker_groups_data', JSON.stringify(stickerGroups));
        }
        
        const otherGroups = stickerGroups.filter(g => g.name !== '通用');
        
        const renderTab = (g) => {
            const div = document.createElement('div');
            div.className = `sticker-group-tab ${currentStickerGroup === g.name ? 'active' : ''}`;
            div.innerText = g.name;

            if (g.name === '通用') {
                div.onclick = () => { currentStickerGroup = g.name; renderStickerGrid(); };
            } else {
                let pressTimer;
                let isLongPress = false;
                
                const startPress = (e) => {
                    isLongPress = false;
                    pressTimer = setTimeout(() => {
                        isLongPress = true;
                        if(navigator.vibrate) navigator.vibrate(50);
                        openStickerGroupBindModal(g.id);
                    }, 500);
                };
                const endPress = (e) => {
                    if (pressTimer) clearTimeout(pressTimer);
                    if (!isLongPress && e.type !== 'touchmove' && e.type !== 'mouseleave') {
                        currentStickerGroup = g.name; 
                        renderStickerGrid();
                    }
                };

                div.addEventListener('touchstart', startPress, {passive: true});
                div.addEventListener('touchend', endPress);
                div.addEventListener('touchmove', () => { if(pressTimer) clearTimeout(pressTimer); });
                div.addEventListener('mousedown', startPress);
                div.addEventListener('mouseup', endPress);
                div.addEventListener('mouseleave', () => { if(pressTimer) clearTimeout(pressTimer); });
            }
            tabsContainer.appendChild(div);
        };

        renderTab(commonGroup);
        otherGroups.forEach(g => renderTab(g));
    }

    const container = document.getElementById('sticker-grid-container');
    container.innerHTML = '';
    
    let filteredStickers = myStickers.filter(s => s.group === currentStickerGroup);

    if (filteredStickers.length === 0) {
        container.innerHTML = `<div style="width:100%; text-align:center; margin-top:50px; color:#aaa; font-size:12px; font-weight:bold;">当前分类暂无表情包</div>`;
        return;
    }

    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'sticker-pages-container';
    
    const chunkSize = 12;
    const pageCount = Math.ceil(filteredStickers.length / chunkSize);
    
    for(let i = 0; i < pageCount; i++) {
        const page = document.createElement('div');
        page.className = 'sticker-page';
        const grid = document.createElement('div');
        grid.className = 'sticker-grid';
        
        const chunk = filteredStickers.slice(i * chunkSize, (i+1) * chunkSize);
        chunk.forEach(sticker => {
            const box = document.createElement('div');
            box.className = 'sticker-item-box';
            let touchEvents = `
                ontouchstart="startStickerPress('${sticker.id}')" ontouchend="endStickerPress()" ontouchmove="endStickerPress()"
                onmousedown="startStickerPress('${sticker.id}')" onmouseup="endStickerPress()" onmouseleave="endStickerPress()"
                onclick="handleStickerClick('${sticker.id}')"
            `;
            box.innerHTML = `
                <div class="sticker-img-wrapper" ${touchEvents}>
                    <img src="${sticker.src}">
                    <div class="sticker-delete-badge" onclick="event.stopPropagation(); deleteSticker('${sticker.id}')">×</div>
                </div>
                <span class="sticker-name">${sticker.name}</span>
            `;
            grid.appendChild(box);
        });
        page.appendChild(grid);
        pagesContainer.appendChild(page);
    }
    
    container.appendChild(pagesContainer);

    if (pageCount > 1) {
        const pagination = document.createElement('div');
        pagination.className = 'sticker-pagination';
        for(let i=0; i<pageCount; i++) {
            const dot = document.createElement('div');
            dot.className = `dot ${i===0 ? 'active' : ''}`;
            dot.onclick = () => pagesContainer.scrollTo({ left: i * pagesContainer.clientWidth, behavior: 'smooth' });
            pagination.appendChild(dot);
        }
        container.appendChild(pagination);

        pagesContainer.addEventListener('scroll', () => {
            const index = Math.round(pagesContainer.scrollLeft / pagesContainer.clientWidth);
            pagination.querySelectorAll('.dot').forEach((d, i) => {
                d.classList.toggle('active', i === index);
            });
        });
    }
}

function startStickerPress(id) {
    stickerPressTimer = setTimeout(() => {
        isStickerEditMode = true;
        document.querySelectorAll('.sticker-item-box').forEach(el => el.classList.add('shake'));
        if(navigator.vibrate) navigator.vibrate(50);
    }, 600);
}
function endStickerPress() { if (stickerPressTimer) clearTimeout(stickerPressTimer); }

function handleStickerClick(id) {
    if (isStickerEditMode) {
        isStickerEditMode = false;
        document.querySelectorAll('.sticker-item-box').forEach(el => el.classList.remove('shake'));
        return;
    }
    const sticker = myStickers.find(s => s.id === id);
    if (sticker) { sendStickerMessage(sticker); closeStickerPanel(); }
}

function deleteSticker(id) {
    if(confirm('确定删除这个表情包吗？')) {
        myStickers = myStickers.filter(s => s.id !== id);
        saveToDB('my_stickers_data', JSON.stringify(myStickers));
        renderStickerGrid();
    }
}

function renderStickerDropdown(type) {
    const dropdown = document.getElementById(`${type}-group-dropdown`);
    const display = document.getElementById(`${type}-group-display`);
    if (!dropdown || !display) return;
    
    dropdown.innerHTML = '';
    
    const commonGroup = stickerGroups.find(g => g.name === '通用');
    const otherGroups = stickerGroups.filter(g => g.name !== '通用');
    
    const renderItem = (g) => {
        const div = document.createElement('div');
        div.className = 'url-option';
        div.innerText = g.name;
        div.style.textAlign = 'center';
        div.style.fontSize = '13px';
        div.style.fontWeight = '600';
        div.onclick = (e) => {
            e.stopPropagation();
            display.innerText = g.name;
            dropdown.classList.remove('active');
        };
        dropdown.appendChild(div);
    };
    
    if(commonGroup) renderItem(commonGroup);
    otherGroups.forEach(g => renderItem(g));
    
    display.innerText = '通用';
}

document.addEventListener('click', function(e) {
    const localMenu = document.getElementById('local-group-dropdown');
    const localInput = document.getElementById('local-group-display')?.parentElement;
    if (localMenu && localMenu.classList.contains('active') && e.target !== localInput && !localInput.contains(e.target)) {
        localMenu.classList.remove('active');
    }

    const batchMenu = document.getElementById('batch-group-dropdown');
    const batchInput = document.getElementById('batch-group-display')?.parentElement;
    if (batchMenu && batchMenu.classList.contains('active') && e.target !== batchInput && !batchInput.contains(e.target)) {
        batchMenu.classList.remove('active');
    }
});

let returnToStickerUploadMode = null; 
function openStickerGroupManager(mode = null) {
    returnToStickerUploadMode = mode;
    renderStickerGroupList();
    document.getElementById('stickerGroupManager').classList.add('active');
}

function closeStickerGroupManager() {
    document.getElementById('stickerGroupManager').classList.remove('active');
    if (returnToStickerUploadMode === 'local') {
        renderStickerDropdown('local');
        document.getElementById('stickerUploadPrompt').classList.add('active');
    } else if (returnToStickerUploadMode === 'batch') {
        renderStickerDropdown('batch');
        document.getElementById('batchStickerPromptOverlay').classList.add('active');
    }
    returnToStickerUploadMode = null;
}


function renderStickerGroupList() {
    const list = document.getElementById('sticker-group-list');
    list.innerHTML = '';
    stickerGroups.forEach(g => {
        const div = document.createElement('div');
        div.className = 'model-item-btn';
        div.style.display = 'flex'; div.style.flexDirection = 'column'; div.style.gap = '8px';
        
        let deleteBtnHtml = g.name !== '通用' 
            ? `<div style="background:#ffe5e5; color:#ff3b30; font-size:11px; padding:4px 10px; border-radius:6px; cursor:pointer; font-weight:800;" onclick="deleteStickerGroup('${g.id}')">删除分组</div>` 
            : `<div style="font-size:10px; color:#bbb; font-weight:800; padding:4px 0;">系统默认(不可删)</div>`;

        let header = `<div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:800; color:#111;">${g.name}</span>
            ${deleteBtnHtml}
        </div>`;
        
        let boundStr = g.name === '通用' ? '自动给所有 AI 角色开放读取该分组' : `绑定特定角色: ${g.boundChars && g.boundChars.length > 0 ? g.boundChars.join(', ') : '暂未绑定 (仅用作自己的分类)'}`;
        let action = g.name !== '通用' ? `<div style="font-size:11px; color:#555; background:#ebebeb; padding:8px; border-radius:8px; cursor:pointer; text-align:center; font-weight:800;" onclick="openStickerGroupBindModal('${g.id}')">选择绑定角色</div>` : '';

        div.innerHTML = `${header}<div style="font-size:10px; color:#888; font-weight:600; line-height:1.4;">${boundStr}</div>${action}`;
        list.appendChild(div);
    });
}

function createStickerGroup() {
    const name = document.getElementById('new-sticker-group-input').value.trim();
    if (!name) return;
    if (stickerGroups.find(g => g.name === name)) { showToast('分组名已存在'); return; }
    stickerGroups.push({ id: 'sg_' + Date.now(), name: name, boundChars: [] });
    saveToDB('sticker_groups_data', JSON.stringify(stickerGroups));
    document.getElementById('new-sticker-group-input').value = '';
    renderStickerGroupList();
    renderStickerGrid(); 
}

function deleteStickerGroup(id) {
    if(confirm('删除分组将同时删除该分组下的所有表情包，确定继续吗？')) {
        const grp = stickerGroups.find(g => g.id === id);
        if(!grp) return;
        myStickers = myStickers.filter(s => s.group !== grp.name);
        stickerGroups = stickerGroups.filter(g => g.id !== id);
        if(currentStickerGroup === grp.name) currentStickerGroup = '通用';
        saveToDB('my_stickers_data', JSON.stringify(myStickers));
        saveToDB('sticker_groups_data', JSON.stringify(stickerGroups));
        renderStickerGroupList();
        renderStickerGrid();
    }
}

let tempBindingGroupId = null;
function openStickerGroupBindModal(id) {
    tempBindingGroupId = id;
    const list = document.getElementById('charSelectList'); 
    list.innerHTML = '';
    document.querySelector('#charSelectOverlay .custom-prompt-title').innerText = '选择要绑定的角色(多选)';
    
    const availableChars = [...new Set(contactsList.map(c => c.realName || c.name))].filter(n => n);
    const grp = stickerGroups.find(g => g.id === id);
    const currentBounds = grp.boundChars || [];

    if (availableChars.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding: 20px 10px; color:#999; font-size:13px;">暂无角色，请去通讯录创建</div>`;
    } else {
        availableChars.forEach(char => {
            const item = document.createElement('div');
            item.className = 'model-item-btn'; 
            item.style.display = 'flex'; item.style.justifyContent = 'space-between';
            const isSelected = currentBounds.includes(char);
            item.innerHTML = `<span>${char}</span> <span style="color:${isSelected?'#111':'#ccc'}; font-weight:bold;">${isSelected?'已选':'未选'}</span>`;
            item.onclick = () => {
                if(currentBounds.includes(char)) { grp.boundChars = grp.boundChars.filter(c => c !== char); } 
                else { grp.boundChars.push(char); }
                saveToDB('sticker_groups_data', JSON.stringify(stickerGroups));
                openStickerGroupBindModal(id); 
                renderStickerGroupList();
            };
            list.appendChild(item);
        });
    }
    document.getElementById('charSelectOverlay').classList.add('active');
}

let tempUploadStickerBase64 = null;
function triggerLocalStickerUpload() { document.getElementById('localStickerInput').click(); }

async function handleLocalStickerUpload(input) {
    const file = input.files[0]; if (!file) return;
    tempUploadStickerBase64 = await compressImage(file, 400, 0.8);
    input.value = ''; 
    document.getElementById('sticker-upload-preview').src = tempUploadStickerBase64;
    document.getElementById('sticker-name-input').value = '';
    renderStickerDropdown('local');
    document.getElementById('stickerUploadPrompt').classList.add('active');
}

function confirmStickerUpload() {
    const name = document.getElementById('sticker-name-input').value.trim() || '未命名';
    const groupName = document.getElementById('local-group-display').innerText || '通用';
    myStickers.push({ id: 'stk_' + Date.now(), src: tempUploadStickerBase64, name: name, group: groupName });
    saveToDB('my_stickers_data', JSON.stringify(myStickers));
    currentStickerGroup = groupName;
    renderStickerGrid();
    showToast(`表情已添加到 ${groupName}`);
    document.getElementById('stickerUploadPrompt').classList.remove('active');
    tempUploadStickerBase64 = null;
}

function openBatchStickerPrompt() {
    renderStickerDropdown('batch');
    document.getElementById('batchStickerInput').value = '';
    document.getElementById('batchStickerPromptOverlay').classList.add('active');
}

function processBatchStickerImport() {
    const text = document.getElementById('batchStickerInput').value.trim();
    if (!text) return;
    const groupName = document.getElementById('batch-group-display').innerText || '通用';
    const lines = text.split('\n'); let count = 0;
    
    lines.forEach(line => {
        let urlMatch = line.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
            let url = urlMatch[1];
// 🌟 新增支持全角（：）和半角（:）冒号作为名字与链接的分割符
let name = line.replace(url, '').replace(/[\+\-\|:：]/g, ' ').trim() || '未命名';
            myStickers.push({ id: 'stk_' + Date.now() + Math.random(), src: url, name: name, group: groupName });
            count++;
        }
    });
    
    if (count > 0) {
        saveToDB('my_stickers_data', JSON.stringify(myStickers));
        currentStickerGroup = groupName;
        renderStickerGrid();
        showToast(`成功导入 ${count} 个表情到 ${groupName}`);
        document.getElementById('batchStickerPromptOverlay').classList.remove('active');
    } else {
        showToast("未识别到有效的图片链接格式");
    }
}

function sendStickerMessage(sticker) {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const msgId = 'msg_' + Date.now();
    const stickerTag = `[STICKER:${sticker.name}]`; 

    const newMsg = { id: msgId, sender: 'user', text: stickerTag, time: timeStr, isSticker: true };
    
    if (activeReplyContext) {
        newMsg.replyCtx = { ...activeReplyContext };
        cancelReply();
    }

    if (!contact.messages) contact.messages = [];
    contact.messages.push(newMsg);

    contact.sign = `[表情: ${sticker.name}]`;
    contact.time = timeStr;
    saveToDB('contacts_data', JSON.stringify(contactsList));
    
    const chatBody = document.getElementById('chatRoomBody');
    const myAvatar = getBoundUserAvatar(contact);
    let touchEvents = `ontouchstart="bubbleTouchStart(event, '${msgId}', 'user', '${timeStr}')" ontouchend="bubbleTouchEnd(event)" ontouchmove="bubbleTouchEnd(event)"`;

    let replyBubbleHtml = '';
    if (newMsg.replyCtx) {
        let shortContent = newMsg.replyCtx.content || '';
        if (shortContent.length > 40) shortContent = shortContent.slice(0, 40) + '...';
        replyBubbleHtml = `<div class="reply-tiny-bubble"><span style="opacity: 0.7; margin-right: 4px;">回复 ${newMsg.replyCtx.name}:</span>${shortContent}</div>`;
    }

    const msgHtml = `
    <div class="preview-msg-row right" id="row-${msgId}" onclick="handleMsgClickInMultiMode('${msgId}', this)" ${touchEvents}>
        <div class="msg-checkbox"></div>
        <div class="msg-stack">
            ${replyBubbleHtml}
            <div class="image-msg-wrapper">
                <span class="image-timestamp" style="margin-right:6px;">${timeStr}</span>
                <img src="${sticker.src}" class="chat-sent-sticker">
            </div>
        </div>
        <img src="${myAvatar}" class="preview-avatar" onclick="handleAvatarDoubleTap('${msgId || msg.id}')" style="cursor: pointer;">
    </div>`;
    chatBody.insertAdjacentHTML('beforeend', msgHtml);
    setTimeout(() => chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' }), 10);
    renderMsgList();
}

// ==========================================
// 🌟 撤回系统：防爆兜底与发光暗黑弹窗引擎
// ==========================================
function viewRecalled(msgId) {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;
    const msg = contact.messages.find(m => m.id === msgId);
    
    if (msg && msg.recalledText) {
        let parts = msg.recalledText.split('|');
        let content = parts[0] ? parts[0].trim() : msg.recalledText.trim();
        let reason = parts[1] ? parts[1].trim() : "（大脑一片空白，没有留下具体原因...）";
        let mood = parts[2] ? parts[2].trim() : "( ˘•ω•˘ )";

        const cEl = document.getElementById('rm-content');
        const rEl = document.getElementById('rm-reason');
        const mEl = document.getElementById('rm-mood');
        const overlay = document.getElementById('recallModalOverlay');
        
        if (cEl && rEl && mEl && overlay) {
            cEl.innerText = content;
            rEl.innerText = reason;
            mEl.innerText = mood;
            overlay.classList.add('active');
        } else {
            alert(`【撤回内容】\n${content}\n\n【原因】\n${reason}\n\n【心情】\n${mood}`);
        }
    }
}

function closeRecallModal() {
    document.getElementById('recallModalOverlay').classList.remove('active');
}

function restoreEdit(msgId) {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;
    const msg = contact.messages.find(m => m.id === msgId);
    if (msg && msg.recalledText) {
        const input = document.getElementById('chatRoomInput');
        if (input) {
            let parts = msg.recalledText.split('|');
            input.value = parts[0]; 
            input.focus();
            input.style.height = 'auto'; 
            input.style.height = input.scrollHeight + 'px';
        }
    }
}
