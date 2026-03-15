// ==========================================
// 00-utils.js: 全局基建与工具函数
// ==========================================

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

// 🌟 终极防错位系统：底层锁定与软键盘强回收
function lockDesktopScroll() {
    const desktop = document.querySelector('.mobile-container');
    if (desktop) desktop.classList.add('no-scroll');
}

function unlockDesktopScroll() {
    const desktop = document.querySelector('.mobile-container');
    if (desktop) {
        desktop.classList.remove('no-scroll');
        desktop.scrollTop = 0; 
    }
    if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
    }
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
}

// 🌟 全局 Toast 弹窗提示 
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

// 🌟 手机状态栏时间同步引擎
function updateSystemTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0'); const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;
    const pastTime = new Date(now.getTime() - 60000); 
    const pastHours = String(pastTime.getHours()).padStart(2, '0'); const pastMinutes = String(pastTime.getMinutes()).padStart(2, '0');
    const pastTimeStr = `${pastHours}:${pastMinutes}`;
    
    if (document.getElementById('chat-time-1')) document.getElementById('chat-time-1').innerText = pastTimeStr;
    if (document.getElementById('chat-time-2')) document.getElementById('chat-time-2').innerText = currentTimeStr;

    // 🌟 实时更新 icity 时钟时间 (格式: YYYY-MM-DD HH:mm)
    const icityTimeEl = document.getElementById('icity-time-display');
    if (icityTimeEl) {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        icityTimeEl.innerText = `${year}-${month}-${date} ${hours}:${minutes}`;
    }
}
updateSystemTime(); 
setInterval(updateSystemTime, 1000);


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
                resolve(canvas.toDataURL('image/jpeg', quality)); 
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 🌟 星座计算工具
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

// 🌟 错误或警告专用的持久化 Toast 弹窗 (点击屏幕任意处关闭)
function showErrorToast(msg) {
    let toast = document.getElementById('errorToast');
    if(!toast) {
        toast = document.createElement('div');
        toast.id = 'errorToast';
        toast.className = 'toast-msg error';
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.add('show');
    
    const dismiss = () => {
        toast.classList.remove('show');
        document.removeEventListener('click', dismiss);
    };
    // 延迟绑定，防止当前的点击事件立刻触发关闭
    setTimeout(() => {
        document.addEventListener('click', dismiss);
    }, 100);
}
