// ==========================================
// 05-mind-voice.js: 自动总结、历史记忆库与心声保险箱系统
// ==========================================

// ==========================================
// 1. 静默后台大模型自动总结系统
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

    // 后台自动总结引擎也必须强制读取该角色专属绑定的身份卡
    let boundProfileId = contact.boundProfileId || 'default';
    let ud = profilePlans.find(p => p.id === boundProfileId)?.data || {};
    let cd = contact.details || {};
    let userStr = `姓名:${ud['text-profile-name']} 性别:${ud['text-detail-gender']} 档案:${ud['text-secret-file']||'无'}`;
    let charStr = `姓名:${contact.realName||contact.name} 性别:${cd.gender} 设定:${cd.secretFile||'无'}`;
    
    let wbStr = "";
    let charRealName = contact.realName || contact.name;
    [...activeWorldbooks.filter(b => b.category === '专属' && b.subGroup === charRealName),
     ...activeWorldbooks.filter(b => b.category === '通用' && b.commonBoundChar === charRealName)].forEach(wb => {
        wb.entries.forEach(e => { wbStr += `[${e.name}]: ${e.content}\n`; });
    });

    let myName = ud['text-profile-name'] || '我';
    let charName = contact.realName || contact.name || '对方';

    // 把聊天记录彻底转化为“客观剧本文本”
    let chatLogText = "";
    msgsToSummarize.forEach(m => {
        let speaker = m.sender === 'user' ? myName : charName;
        chatLogText += `【${speaker}】：${m.text}\n`;
    });

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

    let messagesPayload = [{ role: "user", content: summaryPrompt }];

    try {
        const response = await fetch(`${apiConfig.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiConfig.apiKey}` },
            body: JSON.stringify({
                model: apiConfig.model,
                messages: messagesPayload,
                temperature: 0.5, 
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
            
            if (currentChatContactId === contact.id) {
                showToast("后台自动记忆总结已完成并归档");
            }
        }
    } catch (e) {
        console.error("后台自动总结触发失败", e);
        contact.lastSummaryMsgIndex -= msgsToSummarize.length;
        saveToDB('contacts_data', JSON.stringify(contactsList));
    }
}


// ==========================================
// 2. 历史记忆总结库 UI 与编辑器逻辑
// ==========================================

function openMemorySummaryPrompt() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    // 数据迁移：老的单文本字段，平滑升级成数组库里的第一条数据
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

    const sortedList = [...contact.historySummaries].reverse();
    
    sortedList.forEach((item, reversedIdx) => {
        const realPhaseIdx = contact.historySummaries.length - reversedIdx; // 🌟 计算真实的阶段标号(从1递增)

        const card = document.createElement('div');
        card.className = 'summary-card';
        card.innerHTML = `
            <div class="summary-card-header">
                <span class="summary-time-title">[阶段 ${realPhaseIdx}] ${item.timeRange}</span>
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

let editingSummaryId = null;

function openSummaryEditor(summaryId = null) {
    editingSummaryId = summaryId;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    
    if (summaryId) {
        const item = contact.historySummaries.find(s => s.id === summaryId);
        document.getElementById('summary-time-input').value = item.timeRange;
        document.getElementById('summary-content-input').value = item.content;
    } else {
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
    if(typeof calculateTokens === 'function') calculateTokens(contact);
}

function deleteSummaryItem(id) {
    if (confirm('确定要删除这条历史总结吗？')) {
        const contact = contactsList.find(c => c.id === currentChatContactId);
        contact.historySummaries = contact.historySummaries.filter(s => s.id !== id);
        saveToDB('contacts_data', JSON.stringify(contactsList));
        showToast('已删除');
        renderSummaryList(contact);
        if(typeof calculateTokens === 'function') calculateTokens(contact);
    }
}

// 兼容极其古老的总结保存代码
function saveMemorySummary() {
    const val = document.getElementById('memory-summary-input').value.trim();
    if (currentChatContactId) {
        const contact = contactsList.find(c => c.id === currentChatContactId);
        if (contact) {
            contact.memorySummary = val;
            saveToDB('contacts_data', JSON.stringify(contactsList));
            showToast('记忆总结已保存');
            document.getElementById('memory-summary-overlay').classList.remove('active');
            if(typeof calculateTokens === 'function') calculateTokens(contact);
        }
    }
}


// ==========================================
// 3. 心声 XML 解析拦截与黑弹窗
// ==========================================

function parseAndSaveVoice(xmlString, contact) {
    const getTag = (tag, source = xmlString) => {
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
        const match = source.match(regex);
        return match ? match[1].trim() : '';
    };
    if (!contact.innerVoice) contact.innerVoice = {};
    contact.innerVoice.location = getTag('location');
    contact.innerVoice.action = getTag('action');
    
    contact.innerVoice.thought = getTag('thought').replace(/\n/g, '').trim();
    
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

function showMindBlackToast(msg) {
    const toast = document.getElementById('mind-black-toast');
    toast.innerText = msg;
    toast.classList.add('active');
    
    document.removeEventListener('click', hideMindBlackToast);
    
    setTimeout(() => {
        document.addEventListener('click', hideMindBlackToast);
    }, 10);
}

function hideMindBlackToast() {
    document.getElementById('mind-black-toast').classList.remove('active');
    document.removeEventListener('click', hideMindBlackToast);
}


// ==========================================
// 4. 心声登录保险箱验证逻辑
// ==========================================

function toggleMindRemember() {
    const pwdInput = document.getElementById('mind-pwd-input');
    const chk = document.getElementById('mind-remember-chk');
    
    if (pwdInput.type === 'password') {
        pwdInput.type = 'text'; 
        chk.classList.add('active');
    } else {
        pwdInput.type = 'password'; 
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

    const pwdInput = document.getElementById('mind-pwd-input');
    const chk = document.getElementById('mind-remember-chk');
    pwdInput.type = 'password';
    chk.classList.remove('active');

    let tag1 = contact.details && contact.details.tag1 ? contact.details.tag1 : "前缀";
    const displayId = `${tag1}@Toutou.com`;
    document.getElementById('mind-id-input').value = displayId;

    let myName = currentTempPlan['text-profile-name'] || baseDefaults['text-profile-name'];
    let myBday = currentTempPlan['text-detail-birthday'] || "";
    let bdayStr = myBday ? myBday.split('-')[1] + myBday.split('-')[2] : ""; 
    const correctPwd = `${getPinyinInitials(myName)}${bdayStr}`; 

    pwdInput.value = correctPwd; 

    document.getElementById('mind-login-view').style.display = 'block';
    document.getElementById('mind-quiz-view').style.display = 'none';
    document.getElementById('mind-content-view').style.display = 'none';

    const futureSection = document.getElementById('future-comment-section');
    if (futureSection) futureSection.style.display = 'none';

    document.getElementById('inner-voice-overlay').classList.add('active');
}

function closeInnerVoice(event) {
    if (event && (event.target.id === 'inner-voice-overlay' || event.currentTarget.id === 'inner-voice-overlay')) {
        document.getElementById('inner-voice-overlay').classList.remove('active');
        hideMindBlackToast(); 
    }
}

function verifyVoiceLogin() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact) return;

    let myName = currentTempPlan['text-profile-name'] || baseDefaults['text-profile-name'];
    let myBday = currentTempPlan['text-detail-birthday'] || "";
    let bdayStr = myBday ? myBday.split('-')[1] + myBday.split('-')[2] : ""; 
    const correctPwd = `${getPinyinInitials(myName)}${bdayStr}`; 

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

function showMindQuiz(contact) {
    document.getElementById('mind-login-view').style.display = 'none';
    document.getElementById('mind-quiz-view').style.display = 'block';
    
    document.getElementById('voice-quiz-q').innerText = contact.innerVoice.quiz.q;
    document.getElementById('voice-quiz-opt1').innerText = "A. " + contact.innerVoice.quiz.o1.replace(/^[A-C]\.\s*/i, '');
    document.getElementById('voice-quiz-opt2').innerText = "B. " + contact.innerVoice.quiz.o2.replace(/^[A-C]\.\s*/i, '');
    document.getElementById('voice-quiz-opt3').innerText = "C. " + contact.innerVoice.quiz.o3.replace(/^[A-C]\.\s*/i, '');
}

function checkVoiceQuiz(choiceNum) {
    const contact = contactsList.find(c => c.id === currentChatContactId);
    let correctAns = contact.innerVoice.quiz.ans; 
    
    if (!correctAns || correctAns.includes(choiceNum.toString())) {
        showMindContent(contact); 
    } else {
        showMindBlackToast("选项错误。"); 
    }
}

function showMindContent(contact) {
    document.getElementById('voice-location').innerText = contact.innerVoice.location || "未知";
    document.getElementById('voice-action').innerText = contact.innerVoice.action || "发呆";
    document.getElementById('voice-thought').innerText = contact.innerVoice.thought || "...";

    const futureSection = document.getElementById('future-comment-section');
    
    if (contact.innerVoice.future && contact.innerVoice.future.content) {
        futureSection.style.display = 'flex'; 
        document.getElementById('future-post-avatar').src = contact.avatar;
        document.getElementById('future-post-name').innerText = contact.innerVoice.future.identity || "十年后的对方";
        
        // 🌟 核心：取消所有特效，打开直接就是明文
        document.getElementById('future-comment-text').innerText = contact.innerVoice.future.content;
    } else {
        futureSection.style.display = 'none';
    }

    document.getElementById('mind-login-view').style.display = 'none';
    document.getElementById('mind-quiz-view').style.display = 'none';
    document.getElementById('mind-content-view').style.display = 'block';
}

// 🌟 新增：手动触发强制静默总结
async function triggerManualSummary() {
    if (!currentChatContactId) return;
    const contact = contactsList.find(c => c.id === currentChatContactId);
    if (!contact || !contact.messages) return;
    
    if (contact.isSummarizing) {
        showToast("后台正在执行剧情总结中，请稍后再试");
        return;
    }
    
    let lastSumIndex = contact.lastSummaryMsgIndex || 0;
    if (contact.messages.length - lastSumIndex < 4) {
        showToast("新产生的消息数量太少，暂不需要提取记忆");
        return;
    }
    
    showToast("已下达指令，AI正在静默提取新剧情脉络...");
    contact.isSummarizing = true; 
    const msgsToSummarize = contact.messages.slice(lastSumIndex, contact.messages.length);
    
    contact.lastSummaryMsgIndex = contact.messages.length;
    saveToDB('contacts_data', JSON.stringify(contactsList));
    
    // 强制下达给后台处理，并在完成后刷新 UI
    doAutoSummaryCall(contact, msgsToSummarize).finally(() => {
        contact.isSummarizing = false;
        if (document.getElementById('summary-bottom-sheet').classList.contains('active')) {
            renderSummaryList(contact);
        }
    });
}