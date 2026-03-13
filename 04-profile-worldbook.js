// ==========================================
// 04-profile-worldbook.js: 世界书系统与新建联系人管理
// ==========================================

// ==========================================
// 1. 世界书主面板界面控制
// ==========================================

let availableChars = []; 
let lastPlanetClickTime = 0;

function openWorldbookApp(event) {
    lockDesktopScroll(); 
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
    unlockDesktopScroll(); 
}

function handlePlanetClick(clickedEl) {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - lastPlanetClickTime;
    lastPlanetClickTime = currentTime;
    document.getElementById('wb-popover-menu').classList.remove('active'); 
    
    const txt = clickedEl.textContent.trim(); 
    
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
    isWbDeleteMode = false; 
    renderWorldbookList(finalView); 
}


// ==========================================
// 2. 世界书数据管理 (增删改查/导入导出)
// ==========================================

let isWbDeleteMode = false;

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
                if(typeof recalcCategories === 'function') recalcCategories();
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
    currentCommonBoundChar = ''; 
    toggleSheetGroup('全部'); 
    
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
        groupDisp.style.display = 'flex'; 
        updateCommonGroupUI();
        updateCommonCharBtnUI(); 
    } else {
        charBtn.style.display = 'none';
        groupBtns.style.display = 'none'; groupDisp.style.display = 'none';
    }
}

function openCharSelectModal(isCommon = false) {
    const list = document.getElementById('charSelectList');
    list.innerHTML = '';
    document.querySelector('#charSelectOverlay .custom-prompt-title').innerText = isCommon ? '选择要附加绑定的角色' : '选择要绑定的角色';

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

function editWorldbook(bookId) {
    const book = activeWorldbooks.find(b => b.id === bookId);
    if (!book) return;
    
    editingBookId = bookId;
    document.getElementById('wb-popover-menu').classList.remove('active'); 
    document.getElementById('wb-sheet-overlay').classList.add('active');
    document.getElementById('wb-bottom-sheet').classList.add('active');
    
    document.getElementById('sheet-input-name').value = book.title;
    currentSelectedSubGroup = book.subGroup;
    currentCommonBoundChar = book.commonBoundChar || ''; 
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
    if(typeof recalcCategories === 'function') recalcCategories(); 
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
        if(!currentCommonBoundChar) { showToast('通用世界书必须附加绑定特定角色'); return; }
        subGroup = currentSelectedSubGroup;
    }

    if (editingBookId) {
        const idx = activeWorldbooks.findIndex(b => b.id === editingBookId);
        if (idx > -1) {
            activeWorldbooks[idx].title = bookName;
            activeWorldbooks[idx].category = currentSelectedCategory;
            activeWorldbooks[idx].subGroup = subGroup;
            activeWorldbooks[idx].commonBoundChar = currentCommonBoundChar; 
            activeWorldbooks[idx].entries = JSON.parse(JSON.stringify(tempEntries));
        }
        showToast("世界书已更新！");
    } else {
        const newBook = {
            id: 'wb_' + Date.now(), title: bookName, category: currentSelectedCategory,
            subGroup: subGroup, commonBoundChar: currentCommonBoundChar, 
            entries: JSON.parse(JSON.stringify(tempEntries))
        };
        activeWorldbooks.push(newBook);
        showToast("世界书已保存！");
    }

    saveToDB('worldbooks_data', JSON.stringify(activeWorldbooks));
    if(typeof recalcCategories === 'function') recalcCategories();
    closeWorldbookSheet();
    
    const currentViewText = document.getElementById('wb-current-view').innerText;
    renderWorldbookList(currentViewText);
}

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
// 3. 新建单人联系人与分组管理逻辑
// ==========================================

let ncCustomGroups = ['未分组'];
let ncSelectedGroup = '未分组';
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

// 🌟 新增：新建角色时的生日与星座自动联动引擎
function handleNcBirthdayChange(dateString) {
    if (!dateString) return;
    document.getElementById('display-nc-birthday').value = dateString;
    const date = new Date(dateString);
    const zodiac = getZodiacSign(date.getDate(), date.getMonth() + 1);
    const zodiacInput = document.getElementById('input-nc-zodiac');
    if (zodiacInput) zodiacInput.value = zodiac;
}

function openNewContactSheet() {
    document.getElementById('msg-popover-menu').classList.remove('active');
    document.getElementById('nc-sheet-overlay').classList.add('active');
    document.getElementById('nc-bottom-sheet').classList.add('active');
    
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
// 4. 新建联系人头像上传与独立小白弹窗
// ==========================================

document.addEventListener('click', function(e) {
    const ncMenu = document.getElementById('ncAvatarActionMenu');
    const ncAvatar = document.getElementById('img-nc-avatar');
    if (ncMenu && ncMenu.classList.contains('active') && e.target !== ncMenu && e.target !== ncAvatar) {
        ncMenu.classList.remove('active');
    }
});

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
    
    confirmBtn.className = 'prompt-btn confirm'; 
    
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
        msgEl.innerText = defaultStr; 
        confirmBtn.classList.add('danger'); 
        
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
            contactsList = contactsList.filter(c => c.id !== contactIdToDelete);
            saveToDB('contacts_data', JSON.stringify(contactsList));
            if(typeof renderMsgList === 'function') renderMsgList();
            showToast('角色已彻底删除');
            if (currentChatContactId === contactIdToDelete) {
                if(typeof closeChatSettings === 'function') closeChatSettings();
                if(typeof closeChatRoom === 'function') closeChatRoom();
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
            let defaultText = '新角色';
            if (ncCurrentPromptTarget === 'text-nc-remark') defaultText = '点击设置备注';
            if (el) el.innerText = val === "" ? defaultText : val;
        }
    }
    closeNcCustomPrompt();
}

// ==========================================
// 5. 保存新建联系人 (数据注入通讯录核心)
// ==========================================

function saveNewContact() {
    const avatar = document.getElementById('img-nc-avatar').src;
    const realName = document.getElementById('text-nc-name').innerText.trim();
    const remark = document.getElementById('text-nc-remark').innerText.trim();
    
    const finalRealName = (realName === '新角色' || realName === '在这里输入真实名称' || realName === '') ? '新角色' : realName;
    
    let displayTitle = finalRealName;
    if (remark !== '点击设置备注' && remark !== '') {
        displayTitle = remark;
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newContact = {
        id: 'contact_' + Date.now(),
        avatar: avatar,
        name: displayTitle,   
        realName: finalRealName, 
        sign: "",             
        group: ncSelectedGroup, 
        chatType: 'FRIEND', 
        time: timeStr,
        remark: remark !== '点击设置备注' ? remark : '' 
    };

    newContact.boundProfileId = tempNcBoundProfileId;
    
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
    if(typeof updateProfileAvatars === 'function') updateProfileAvatars(); 

    showToast(`成功添加：${displayTitle}`);

    closeNewContactSheet();
    
    const allTabBtn = document.querySelector('.msg-sub-tab');
    if(allTabBtn && typeof switchMsgSubTab === 'function') switchMsgSubTab(allTabBtn, 'ALL');
    else if(typeof renderMsgList === 'function') renderMsgList();
}

function promptDeleteContactFromSettings() {
    contactIdToDelete = currentChatContactId;
    openNcCustomPrompt('删除角色', 'action_delete_contact', '确定要彻底删除此角色吗？此操作将清除其相关资料与聊天记录（不影响世界书）。', 'confirm_delete');
}
