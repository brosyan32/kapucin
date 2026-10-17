document.addEventListener('DOMContentLoaded', () => {
    // === НАСТРОЙКИ SUPABASE: впиши свои значения ===
    const SUPABASE_URL = 'https://whsxcrzzffhblizbkvvg.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_j_oWD93A76H1e_XAQ6DNUg_mKItq7Ya';
    const HEADERS = { 'apikey': SUPABASE_KEY };

    // Модальные элементы
    const bookingModal = document.getElementById('bookingModal');
    const menuModal = document.getElementById('menuModal');
    const openModalBtns = document.querySelectorAll('.open-modal-btn');
    const closeModal = document.querySelector('.close-modal');
    const closeMenuModal = document.querySelector('.close-menu-modal');

    // Открытие модалки бронирования
    openModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            bookingModal.style.display = 'flex';
        });
    });

    // Закрытие модалок
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            bookingModal.style.display = 'none';
        });
    }
    if (closeMenuModal) {
        closeMenuModal.addEventListener('click', () => {
            menuModal.style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === bookingModal) bookingModal.style.display = 'none';
        if (e.target === menuModal) menuModal.style.display = 'none';
    });

    // Клик по карточкам меню (данные из Supabase)
    const menuCards = document.querySelectorAll('.menu-card');
    const modalMenuTitle = document.getElementById('modalMenuTitle');
    const modalMenuContent = document.getElementById('modalMenuContent');

    menuCards.forEach(card => {
        card.addEventListener('click', async () => {
            const category = card.getAttribute('data-category');
            modalMenuTitle.textContent = card.querySelector('h3').textContent;
            modalMenuContent.innerHTML = '';
            menuModal.style.display = 'flex';

            try {
                const url = SUPABASE_URL + '/rest/v1/menu_items'
                    + '?select=name,price,categories!inner(slug)'
                    + '&categories.slug=eq.' + encodeURIComponent(category)
                    + '&order=sort_order,id';
                const res = await fetch(url, { headers: HEADERS });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const items = await res.json();

                items.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'modal-menu-item';
                    const n = document.createElement('span');
                    n.textContent = item.name;
                    const p = document.createElement('span');
                    p.textContent = item.price + ' ₽';
                    row.append(n, p);
                    modalMenuContent.appendChild(row);
                });
            } catch (e) {
                console.error(e);
                modalMenuContent.textContent = 'Не удалось загрузить меню';
            }
        });
    });

    // Отправка брони в Supabase
    async function sendBooking(form) {
        const f = new FormData(form);
        const body = {
            name: (f.get('name') || '').trim(),
            phone: (f.get('phone') || '').trim(),
            email: (f.get('email') || '').trim() || null,
            guests: parseInt(f.get('guests'), 10),
            reserve_date: f.get('date'),
            reserve_time: f.get('time'),
            comment: (f.get('comment') || '').trim() || null
        };

        const res = await fetch(SUPABASE_URL + '/rest/v1/reservations', {
            method: 'POST',
            headers: { ...HEADERS, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            console.error(await res.text());
            throw new Error('Не удалось отправить заявку, проверьте данные и попробуйте ещё раз');
        }
    }

    const bookingForm = document.getElementById('bookingForm');
    const modalBookingForm = document.getElementById('modalBookingForm');

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await sendBooking(bookingForm);
                alert('Спасибо! Ваш запрос на бронирование принят. Мы свяжемся с вами в ближайшее время.');
                bookingForm.reset();
            } catch (err) { alert(err.message); }
        });
    }

    if (modalBookingForm) {
        modalBookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await sendBooking(modalBookingForm);
                alert('Заявка отправлена! Ждем вас в «Капуцин».');
                modalBookingForm.reset();
                bookingModal.style.display = 'none';
            } catch (err) { alert(err.message); }
        });
    }
});