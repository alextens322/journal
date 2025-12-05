// ====================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ И УТИЛИТЫ
// ====================

// Глобальная переменная для хранения данных
let gradesData = [];

// ====================
// ФУНКЦИИ ДЛЯ РАБОТЫ С КОДИРОВКАМИ
// ====================

// Функция для определения и исправления кодировки
function detectAndFixEncoding(arrayBuffer) {
    // Список кодировок для проверки
    const encodings = ['UTF-8', 'windows-1251', 'ISO-8859-5', 'KOI8-R', 'CP866', 'CP1251'];
    
    console.log("Пытаемся определить кодировку файла...");
    
    for (let encoding of encodings) {
        try {
            const decoder = new TextDecoder(encoding);
            const decodedText = decoder.decode(arrayBuffer);
            
            // Проверяем, есть ли в тексте кириллические символы
            const cyrillicRegex = /[а-яА-ЯЁё]/;
            if (cyrillicRegex.test(decodedText)) {
                console.log(`✅ Успешная кодировка: ${encoding}`);
                
                // Дополнительная проверка: ищем ключевые слова
                const hasStudentInfo = decodedText.includes('ученик') || 
                                     decodedText.includes('ФИО') || 
                                     decodedText.includes('класс') ||
                                     decodedText.includes('Овчинникова') ||
                                     decodedText.includes('Мещерякова');
                
                if (hasStudentInfo) {
                    console.log(`✅ Найдены ключевые слова, кодировка ${encoding} подтверждена`);
                    return { text: decodedText, encoding: encoding };
                } else if (encoding === 'windows-1251' || encoding === 'UTF-8') {
                    // Если не нашли ключевые слова, но это распространенная кодировка
                    console.log(`⚠️  Ключевые слова не найдены, но используем ${encoding}`);
                    return { text: decodedText, encoding: encoding };
                }
            }
        } catch (error) {
            console.log(`❌ Ошибка при декодировании ${encoding}:`, error.message);
        }
    }
    
    // Если не удалось определить кодировку, пробуем UTF-8
    try {
        const decoder = new TextDecoder('UTF-8');
        const decodedText = decoder.decode(arrayBuffer);
        console.log('⚠️  Используем UTF-8 по умолчанию');
        return { text: decodedText, encoding: 'UTF-8' };
    } catch (error) {
        console.error('❌ Не удалось декодировать файл');
        return { text: '', encoding: 'unknown' };
    }
}

// Альтернативный метод для исправления кракозябр
function fixCyrillicText(text) {
    if (!text) return text;
    
    console.log("Исходный текст (первые 100 символов):", text.substring(0, 100));
    
    // Маппинг распространенных неправильных последовательностей
    const fixMap = {
        // Windows-1251 прочитанная как UTF-8
        'пїЅ': 'я', 'пїЅ': 'Я',
        'пї': 'и', 'Ѕ': '',
        'Рѕ': 'о', 'Р': '', 'ѕ': '',
        'вЂ™': "'", 'вЂњ': '"', 'вЂќ': '"',
        'вЂ“': '-', 'вЂ”': '—',
        
        // Другие распространенные проблемы
        '�': '', 'ï': 'и', 'ð': 'р', 'ñ': 'с',
        'ò': 'т', 'ó': 'у', 'ô': 'ф', 'õ': 'х'
    };
    
    let fixedText = text;
    
    // Заменяем неправильные последовательности
    for (const [wrong, correct] of Object.entries(fixMap)) {
        fixedText = fixedText.replace(new RegExp(wrong, 'g'), correct);
    }
    
    // Удаляем оставшиеся непечатаемые символы
    fixedText = fixedText.replace(/[^\x20-\x7E\u0400-\u04FF\n\r;,\t]/g, '');
    
    console.log("Исправленный текст (первые 100 символов):", fixedText.substring(0, 100));
    
    return fixedText;
}

// ====================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ
// ====================

// Загрузка данных из localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('gradesJournalData');
    if (savedData) {
        try {
            gradesData = JSON.parse(savedData);
            console.log(`✅ Загружено ${gradesData.length} записей из localStorage`);
        } catch (e) {
            console.error('❌ Ошибка загрузки данных из localStorage:', e);
            gradesData = [];
        }
    } else {
        gradesData = [];
        console.log('ℹ️ Нет данных в localStorage');
    }
    return gradesData;
}

// Сохранение данных в localStorage
function saveToLocalStorage() {
    localStorage.setItem('gradesJournalData', JSON.stringify(gradesData));
    console.log(`💾 Сохранено ${gradesData.length} записей в localStorage`);
}

// Функция для нормализации названий предметов
function normalizeSubjectName(subject) {
    if (!subject) return subject;
    
    const lowerSubject = subject.toLowerCase().trim();
    
    // Словарь для нормализации названий предметов
    const subjectMap = {
        'информатика': 'Информатика',
        'информатик': 'Информатика',
        'informatics': 'Информатика',
        'физика': 'Физика',
        'physics': 'Физика',
        'математика': 'Математика',
        'матема': 'Математика',
        'mathemathics': 'Математика',
        'литература': 'Литература',
        'литера': 'Литература',
        'literature': 'Литература',
        'музыка': 'Музыка',
        'music': 'Музыка',
        'русский язык': 'Русский язык',
        'русский': 'Русский язык',
        'история': 'История',
        'history': 'История',
        'химия': 'Химия',
        'chemistry': 'Химия',
        'английский язык': 'Английский язык',
        'английский': 'Английский язык',
        'english': 'Английский язык'
    };
    
    // Ищем точное или частичное совпадение
    for (const [key, value] of Object.entries(subjectMap)) {
        if (lowerSubject.includes(key) || key.includes(lowerSubject)) {
            return value;
        }
    }
    
    // Если не нашли в словаре, возвращаем с заглавной буквы
    return subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
}

// Парсинг CSV файла - УПРОЩЕННАЯ ВЕРСИЯ
function parseCSVSimple(content) {
    console.log("Начинаем парсинг CSV...");
    console.log("Длина контента:", content.length);
    
    const lines = content.split('\n');
    console.log("Количество строк:", lines.length);
    
    const result = [];
    
    if (lines.length < 2) {
        console.log("❌ Слишком мало строк в файле");
        return result;
    }
    
    // Определяем разделитель
    const firstLine = lines[0];
    console.log("Первая строка (заголовок):", firstLine);
    
    let delimiter = ';';
    if (firstLine.includes(';')) {
        delimiter = ';';
        console.log("Разделитель: точка с запятой (;)");
    } else if (firstLine.includes(',')) {
        delimiter = ',';
        console.log("Разделитель: запятая (,)");
    } else if (firstLine.includes('\t')) {
        delimiter = '\t';
        console.log("Разделитель: табуляция (\\t)");
    }
    
    // Получаем заголовки
    const headers = firstLine.trim().split(delimiter).map(h => h.trim());
    console.log("Заголовки:", headers);
    
    // Проверяем формат файла
    const hasName = headers.some(h => h.toLowerCase().includes('name') || 
                                       h.toLowerCase().includes('фио') || 
                                       h.toLowerCase().includes('ученик') ||
                                       h.toLowerCase().includes('имя'));
    
    const hasClass = headers.some(h => h.toLowerCase().includes('class') || 
                                        h.toLowerCase().includes('класс'));
    
    if (!hasName || !hasClass) {
        console.log("❌ В файле нет обязательных столбцов (ФИО и класс)");
        return result;
    }
    
    // Определяем индексы столбцов
    const nameIndex = headers.findIndex(h => 
        h.toLowerCase().includes('name') || 
        h.toLowerCase().includes('фио') || 
        h.toLowerCase().includes('ученик') ||
        h.toLowerCase().includes('имя')
    );
    
    const classIndex = headers.findIndex(h => 
        h.toLowerCase().includes('class') || 
        h.toLowerCase().includes('класс')
    );
    
    console.log(`Индекс ФИО: ${nameIndex}, Индекс класса: ${classIndex}`);
    
    // Обрабатываем данные
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        console.log(`Строка ${i}: ${line.substring(0, 50)}...`);
        
        const values = line.split(delimiter);
        
        // Проверяем, достаточно ли значений
        if (values.length < Math.max(nameIndex, classIndex) + 1) {
            console.log(`⚠️  Строка ${i} содержит слишком мало значений: ${values.length}`);
            continue;
        }
        
        const studentName = values[nameIndex] ? values[nameIndex].trim() : '';
        const studentClass = values[classIndex] ? values[classIndex].trim() : '';
        
        if (!studentName || !studentClass) {
            console.log(`⚠️  Пропущена строка ${i}: нет имени или класса`);
            continue;
        }
        
        // Обрабатываем предметы и оценки
        for (let j = 0; j < headers.length; j++) {
            if (j === nameIndex || j === classIndex) continue;
            
            const subject = headers[j];
            const gradeStr = values[j] ? values[j].trim() : '';
            
            if (subject && gradeStr && !isNaN(parseInt(gradeStr))) {
                const grade = parseInt(gradeStr);
                
                if (grade >= 2 && grade <= 5) {
                    result.push({
                        name: studentName,
                        class: studentClass,
                        subject: normalizeSubjectName(subject),
                        grade: grade,
                        date: new Date().toISOString().split('T')[0]
                    });
                    
                    console.log(`✓ Добавлена запись: ${studentName} - ${subject}: ${grade}`);
                }
            }
        }
    }
    
    console.log(`✅ Всего загружено записей: ${result.length}`);
    return result;
}

// ====================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ФАЙЛАМИ
// ====================

// Обработчик загрузки файла - УЛУЧШЕННАЯ ВЕРСИЯ
function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        console.log("❌ Файл не выбран");
        showAlert('Файл не выбран', 'error');
        return;
    }
    
    console.log(`📁 Загружаем файл: ${file.name}, размер: ${file.size} байт`);
    showAlert(`Загружаем файл: ${file.name}...`, 'success');
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        console.log("✅ Файл прочитан успешно");
        
        let arrayBuffer;
        if (e.target.result instanceof ArrayBuffer) {
            arrayBuffer = e.target.result;
        } else {
            // Конвертируем в ArrayBuffer
            const text = e.target.result;
            const encoder = new TextEncoder();
            arrayBuffer = encoder.encode(text).buffer;
        }
        
        // Определяем и исправляем кодировку
        const result = detectAndFixEncoding(arrayBuffer);
        
        if (!result.text) {
            showAlert('Не удалось прочитать файл. Возможно, неподдерживаемая кодировка.', 'error');
            return;
        }
        
        console.log(`✅ Используется кодировка: ${result.encoding}`);
        
        // Парсим CSV
        const newData = parseCSVSimple(result.text);
        
        if (newData.length === 0) {
            // Пробуем исправить текст и парсить еще раз
            console.log("🔄 Пробуем исправить текст и парсить еще раз...");
            const fixedText = fixCyrillicText(result.text);
            const fixedData = parseCSVSimple(fixedText);
            
            if (fixedData.length > 0) {
                processLoadedData(fixedData, `Успешно загружено ${fixedData.length} записей (с исправлением кодировки)`);
            } else {
                showAlert('Не удалось загрузить данные из файла. Проверьте формат и кодировку файла.', 'error');
            }
        } else {
            processLoadedData(newData, `Успешно загружено ${newData.length} записей из файла`);
        }
    };
    
    reader.onerror = function(e) {
        console.error("❌ Ошибка при чтении файла:", e);
        showAlert('Ошибка при чтении файла. Пожалуйста, выберите другой файл.', 'error');
    };
    
    // Читаем файл как ArrayBuffer
    reader.readAsArrayBuffer(file);
}

// Обработка загруженных данных
function processLoadedData(newData, successMessage) {
    // Добавляем ID к новым записям
    newData.forEach((item, index) => {
        item.id = Date.now() + index;
        if (!item.date) item.date = new Date().toISOString().split('T')[0];
    });
    
    // Загружаем существующие данные
    loadFromLocalStorage();
    
    // Добавляем новые данные
    gradesData = gradesData.concat(newData);
    saveToLocalStorage();
    
    // Показываем успешное сообщение
    showAlert(successMessage, 'success');
    
    // Очищаем поле выбора файла
    document.getElementById('fileInput').value = '';
    
    // Обновляем интерфейс если на странице есть соответствующие элементы
    if (typeof updateTables === 'function') updateTables();
    if (typeof updateJournalTable === 'function') updateJournalTable();
    if (typeof updateGradesView === 'function') updateGradesView();
    if (typeof updateUploadedTable === 'function') updateUploadedTable();
    
    // Показываем примеры загруженных данных
    if (newData.length > 0) {
        console.log("📋 Примеры загруженных данных:");
        for (let i = 0; i < Math.min(3, newData.length); i++) {
            console.log(`  ${i+1}. ${newData[i].name} - ${newData[i].subject}: ${newData[i].grade}`);
        }
    }
}

// ====================
// ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений)
// ====================

// Очистка всех данных
function clearData() {
    if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
        gradesData = [];
        saveToLocalStorage();
        
        showAlert('Все данные были удалены', 'success');
        
        // Обновляем интерфейс
        if (typeof updateTables === 'function') updateTables();
        if (typeof updateJournalTable === 'function') updateJournalTable();
        if (typeof updateGradesView === 'function') updateGradesView();
        if (typeof updateUploadedTable === 'function') updateUploadedTable();
    }
}

// ====================
// ФУНКЦИИ ДЛЯ РАБОТЫ С ЖУРНАЛОМ
// ====================

// Добавление нового ученика
function addStudent() {
    const name = document.getElementById('studentName').value.trim();
    const studentClass = document.getElementById('studentClass').value.trim();
    const subject = document.getElementById('subject').value;
    const grade = parseInt(document.getElementById('grade').value);
    const date = document.getElementById('date').value || new Date().toISOString().split('T')[0];
    
    if (!name || !studentClass || !subject || isNaN(grade)) {
        showAlert('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    const newStudent = {
        id: Date.now(),
        name,
        class: studentClass,
        subject,
        grade,
        date
    };
    
    // Загружаем существующие данные
    loadFromLocalStorage();
    
    // Добавляем новую запись
    gradesData.push(newStudent);
    saveToLocalStorage();
    
    // Очистка формы
    document.getElementById('studentForm').reset();
    if (document.getElementById('date')) {
        document.getElementById('date').valueAsDate = new Date();
    }
    
    showAlert('Запись успешно добавлена', 'success');
    
    // Обновляем таблицу если на странице есть соответствующий элемент
    if (typeof updateJournalTable === 'function') {
        updateJournalTable();
    }
}

// Обновление таблицы журнала
function updateJournalTable() {
    const tbody = document.getElementById('journalTableBody');
    if (!tbody) {
        console.log("ℹ️ Элемент journalTableBody не найден на этой странице");
        return;
    }
    
    tbody.innerHTML = '';
    
    // Загружаем данные
    loadFromLocalStorage();
    
    if (gradesData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">Журнал пуст. Добавьте первую запись.</td></tr>`;
        return;
    }
    
    console.log(`📊 Отображаем ${gradesData.length} записей в журнале`);
    
    // Сортируем по дате (новые сначала)
    const sortedData = [...gradesData].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedData.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td>${student.subject}</td>
            <td>${student.grade}</td>
            <td>${student.date}</td>
            <td>
                <button class="btn table-btn" onclick="startEditStudent(${student.id})">Изменить</button>
                <button class="btn btn-danger table-btn" onclick="deleteStudent(${student.id})">Удалить</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Начало редактирования ученика
function startEditStudent(id) {
    // Загружаем данные
    loadFromLocalStorage();
    
    const student = gradesData.find(s => s.id === id);
    if (!student) {
        showAlert('Запись не найдена', 'error');
        return;
    }
    
    // Заполняем форму
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentClass').value = student.class;
    document.getElementById('subject').value = student.subject;
    document.getElementById('grade').value = student.grade;
    document.getElementById('date').value = student.date;
    
    // Сохраняем ID редактируемой записи
    window.currentEditId = id;
    
    // Изменяем состояние кнопок
    document.getElementById('saveStudent').disabled = true;
    document.getElementById('updateStudent').disabled = false;
    
    showAlert('Редактирование записи. Внесите изменения и нажмите "Сохранить изменения"', 'success');
}

// Обновление данных ученика
function updateStudent() {
    if (!window.currentEditId) {
        showAlert('Нет записи для редактирования', 'error');
        return;
    }
    
    const name = document.getElementById('studentName').value.trim();
    const studentClass = document.getElementById('studentClass').value.trim();
    const subject = document.getElementById('subject').value;
    const grade = parseInt(document.getElementById('grade').value);
    const date = document.getElementById('date').value;
    
    if (!name || !studentClass || !subject || isNaN(grade)) {
        showAlert('Пожалуйста, заполните все обязательные поля', 'error');
        return;
    }
    
    // Загружаем данные
    loadFromLocalStorage();
    
    const index = gradesData.findIndex(s => s.id === window.currentEditId);
    if (index === -1) {
        showAlert('Запись не найдена', 'error');
        return;
    }
    
    // Обновляем запись
    gradesData[index] = {
        id: window.currentEditId,
        name,
        class: studentClass,
        subject,
        grade,
        date
    };
    
    saveToLocalStorage();
    cancelEdit();
    updateJournalTable();
    
    showAlert('Запись успешно обновлена', 'success');
}

// Отмена редактирования
function cancelEdit() {
    window.currentEditId = null;
    document.getElementById('studentForm').reset();
    if (document.getElementById('date')) {
        document.getElementById('date').valueAsDate = new Date();
    }
    
    document.getElementById('saveStudent').disabled = false;
    document.getElementById('updateStudent').disabled = true;
}

// Удаление ученика
function deleteStudent(id) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
        return;
    }
    
    // Загружаем данные
    loadFromLocalStorage();
    
    // Фильтруем данные
    gradesData = gradesData.filter(s => s.id !== id);
    saveToLocalStorage();
    
    // Обновляем таблицу
    updateJournalTable();
    
    showAlert('Запись успешно удалена', 'success');
}

// ====================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ====================

// Показать уведомление
function showAlert(message, type) {
        alert(message);
        return;
	}

// ====================
// ФУНКЦИИ ЭКСПОРТА
// ====================

// Экспорт в CSV
function exportToCSV() {
    // Загружаем данные
    loadFromLocalStorage();
    
    if (gradesData.length === 0) {
        showAlert('Нет данных для экспорта', 'error');
        return;
    }
    
    // Создаем CSV заголовок
    const headers = ['ФИО ученика', 'Класс', 'Предмет', 'Оценка', 'Дата'];
    let csvContent = headers.join(';') + '\n';
    
    // Добавляем данные
    gradesData.forEach(student => {
        const row = [
            `"${student.name}"`,
            student.class,
            student.subject,
            student.grade,
            student.date
        ];
        csvContent += row.join(';') + '\n';
    });
    
    // Создаем и скачиваем файл
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `оценки.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert(`Экспортировано ${gradesData.length} записей в CSV`, 'success');
}

// Экспорт в JSON
function exportToJSON() {
    // Загружаем данные
    loadFromLocalStorage();
    
    if (gradesData.length === 0) {
        showAlert('Нет данных для экспорта', 'error');
        return;
    }
    
    // Форматируем JSON
    const jsonContent = JSON.stringify(gradesData, null, 2);
    
    // Создаем и скачиваем файл
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `оценки.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert(`Экспортировано ${gradesData.length} записей в JSON`, 'success');
}

// Экспорт таблицы из grades-view.html
function exportGradesViewToCSV() {
    // Загружаем данные
    loadFromLocalStorage();
    
    if (gradesData.length === 0) {
        showAlert('Нет данных для экспорта', 'error');
        return;
    }
    
    // Группируем данные для табличного представления
    const classes = {};
    gradesData.forEach(record => {
        if (!classes[record.class]) {
            classes[record.class] = {};
        }
        
        if (!classes[record.class][record.name]) {
            classes[record.class][record.name] = {};
        }
        
        classes[record.class][record.name][record.subject] = record.grade;
    });
    
    // Получаем все предметы
    const allSubjects = new Set();
    gradesData.forEach(record => {
        allSubjects.add(record.subject);
    });
    const subjects = Array.from(allSubjects).sort();
    
    // Создаем CSV
    let csvContent = 'Класс;ФИО ученика;' + subjects.join(';') + '\n';
    
    // Для каждого класса
    Object.keys(classes).sort().forEach(className => {
        // Ученики этого класса
        const students = Object.keys(classes[className]).sort();
        students.forEach(studentName => {
            const row = [className, `"${studentName}"`];
            
            // Оценки по предметам
            subjects.forEach(subject => {
                const grade = classes[className][studentName][subject] || '';
                row.push(grade);
            });
            
            csvContent += row.join(';') + '\n';
        });
    });
    
    // Создаем и скачиваем файл
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `оценки.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert(`Экспортирована таблица оценок`, 'success');
}

// ====================
// ИНИЦИАЛИЗАЦИЯ
// ====================

// Автоматическая загрузка данных при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Страница загружена, загружаем данные из localStorage...');
    loadFromLocalStorage();
    
    // Если на странице есть таблица журнала, обновляем ее
    if (document.getElementById('journalTableBody')) {
        console.log('📋 Обнаружена таблица журнала, обновляем...');
        updateJournalTable();
    }
});