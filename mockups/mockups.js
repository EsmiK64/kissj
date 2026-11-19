/* ==========================================================================
   kissj Mockups — Lightweight Interactive Prototype JS
   Zero dependencies; powers live testing of calendar creation/editing,
   check-in soft-block/override, guest walk-in, approvals, and table filters.
   ========================================================================== */

(() => {
    // Event-Specific Stylesheet Switcher (works on both serve.php and static GitHub Pages)
    const themeSelect = document.getElementById('event-theme-switcher');
    const themeLink = document.getElementById('event-theme-link');
    const assetPrefix = document.querySelector('link[href$="mockups.css"]')?.getAttribute('href')?.replace('mockups.css', '') || '/';
    const applyEventTheme = (href) => {
        const resolved = href ? `${assetPrefix}${href.replace(/^\//, '')}` : '';
        if (themeLink) themeLink.setAttribute('href', resolved);
        if (themeSelect) themeSelect.value = href || '';
        const selectedText = themeSelect?.selectedOptions[0]?.textContent || 'Obrok 27';
        document.querySelectorAll('.admin-event-badge').forEach((badge) => {
            badge.textContent = href ? selectedText : 'Výchozí (Obrok 27)';
        });
        const isObrok27 = Boolean(href && href.includes('Obrok27'));
        document.body.classList.toggle('theme-obrok27', isObrok27);
    };
    const savedTheme = localStorage.getItem('kissj_mockup_theme') || '';
    applyEventTheme(savedTheme);
    themeSelect?.addEventListener('change', () => {
        const val = themeSelect.value;
        localStorage.setItem('kissj_mockup_theme', val);
        applyEventTheme(val);
    });

    const showToast = (msg, type = 'success') => {
        let box = document.querySelector('.mockup-toast-box');
        if (!box) {
            box = document.createElement('div');
            box.className = 'mockup-toast-box';
            box.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:360px;';
            document.body.appendChild(box);
        }
        const el = document.createElement('div');
        el.className = `alert alert-${type}`;
        el.style.cssText = 'margin:0;text-align:left;box-shadow:0 4px 14px rgba(0,0,0,0.2);';
        el.textContent = msg;
        box.appendChild(el);
        setTimeout(() => el.remove(), 3200);
    };

    // ----------------------------------------------------------------------
    // 1. Live Table Search & Select Filtering (generic for all subpages)
    // ----------------------------------------------------------------------
    document.querySelectorAll('.filter-bar').forEach((bar) => {
        const search = bar.querySelector('input[type="search"]');
        const selects = bar.querySelectorAll('select');
        const card = bar.closest('.admin-card');
        if (!card) return;
        const tbody = card.querySelector('.data-table tbody');
        if (!tbody) return;

        const applyFilter = () => {
            const q = (search?.value || '').trim().toLowerCase();
            const selectVals = Array.from(selects)
                .map((s) => s.value.trim().toLowerCase())
                .filter(Boolean);

            tbody.querySelectorAll('tr').forEach((row) => {
                const text = row.textContent.toLowerCase();
                const matchSearch = !q || text.includes(q);
                const matchSelects = selectVals.every((val) => text.includes(val));
                row.style.display = matchSearch && matchSelects ? '' : 'none';
            });
        };

        search?.addEventListener('input', applyFilter);
        selects.forEach((s) => s.addEventListener('change', applyFilter));
    });

    // ----------------------------------------------------------------------
    // 2. Programmes: Google Calendar Drag-to-Move, Drag-to-Resize & Modal
    // ----------------------------------------------------------------------
    const calBody = document.querySelector('.cal-gcal-body');
    const modal = document.getElementById('prog-modal');
    if (calBody && modal) {
        const dayDates = ['2027-05-14', '2027-05-15', '2027-05-16'];
        const secClassMap = {
            outdoor: 'cal-sec-outdoor',
            debaty: 'cal-sec-debaty',
            dilny: 'cal-sec-dilny',
            povinne: 'cal-sec-povinne',
        };

        const titleEl = document.getElementById('prog-modal-title');
        const badgeEl = document.getElementById('prog-modal-badge');
        const closeBtn = document.getElementById('prog-modal-close');
        const saveBtn = document.getElementById('prog-modal-save');
        const delBtn = document.getElementById('prog-modal-delete');
        const nameInput = document.getElementById('prog-modal-name');
        const startInput = document.getElementById('prog-modal-start');
        const endInput = document.getElementById('prog-modal-end');
        const secSelect = document.getElementById('prog-modal-sec');
        const placeInput = document.getElementById('prog-modal-place');
        const capInput = document.getElementById('prog-modal-cap');
        const newProgCta = document.querySelector('a[href="#new-prog"]');

        const secLabelMap = {
            outdoor: { label: 'Outdoor', pill: 'pill-ok' },
            debaty: { label: 'Debaty', pill: 'pill-info' },
            dilny: { label: 'Dílny', pill: 'pill-warn' },
            povinne: { label: 'Povinné', pill: 'pill-neutral' },
        };
        const dayShortMap = { '2027-05-14': 'Pá', '2027-05-15': 'So', '2027-05-16': 'Ne' };

        const syncScheduleTable = () => {
            const listTbody = document.querySelector('.panel-list .data-table tbody');
            if (!listTbody) return;
            listTbody.textContent = '';
            calBody.querySelectorAll('.cal-event').forEach((ev) => {
                const startVal = ev.dataset.start || '2027-05-15T09:00';
                const endVal = ev.dataset.end || '2027-05-15T10:00';
                const [dateP, startT] = startVal.split('T');
                const endT = endVal.split('T')[1] || '10:00';
                const title = ev.querySelector('.cal-event-top span')?.textContent || 'Program';
                const occText = ev.querySelector('.cal-occ')?.textContent || '0/25';
                const sec = ev.dataset.sec || 'outdoor';
                const secInfo = secLabelMap[sec] || secLabelMap.outdoor;

                const tr = document.createElement('tr');
                const tdTime = document.createElement('td');
                tdTime.textContent = `${dayShortMap[dateP] || ''} ${startT} – ${endT}`;

                const tdName = document.createElement('td');
                const b = document.createElement('b');
                b.textContent = title;
                tdName.appendChild(b);

                const tdSec = document.createElement('td');
                const pill = document.createElement('span');
                pill.className = `pill ${secInfo.pill}`;
                pill.textContent = secInfo.label;
                tdSec.appendChild(pill);

                const tdPlace = document.createElement('td');
                tdPlace.textContent = ev.dataset.place || 'Areál';

                const tdOcc = document.createElement('td');
                tdOcc.textContent = occText;

                const tdRole = document.createElement('td');
                tdRole.textContent = 'Všichni';

                const tdAct = document.createElement('td');
                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'btn btn-mini btn-grey';
                editBtn.textContent = 'Upravit';
                editBtn.addEventListener('click', () => openForBlock(ev));
                tdAct.appendChild(editBtn);

                tr.append(tdTime, tdName, tdSec, tdPlace, tdOcc, tdRole, tdAct);
                listTbody.appendChild(tr);
            });
        };

        const renderCalBlockContent = (el, name, occText, timeLabel, place) => {
            el.textContent = '';
            const top = document.createElement('div');
            top.className = 'cal-event-top';
            const titleSpan = document.createElement('span');
            titleSpan.textContent = name;
            const occSpan = document.createElement('span');
            occSpan.className = 'cal-occ';
            occSpan.textContent = occText;
            top.append(titleSpan, occSpan);

            const meta = document.createElement('div');
            meta.className = 'cal-event-meta';
            meta.textContent = `${timeLabel} · ${place}`;

            const handle = document.createElement('span');
            handle.className = 'cal-resize-handle';
            handle.setAttribute('aria-hidden', 'true');

            el.append(top, meta, handle);
        };

        let selectedBlock = null;
        let suppressNextClick = false;

        const formatHours = (hFloat) => {
            const totalMins = Math.round(hFloat * 60);
            const hh = String(Math.floor(totalMins / 60)).padStart(2, '0');
            const mm = String(totalMins % 60).padStart(2, '0');
            return `${hh}:${mm}`;
        };

        const parseTimeHours = (dtStr) => {
            const timePart = (dtStr || '').split('T')[1] || '09:00';
            const [hh, mm] = timePart.split(':').map(Number);
            return hh + (mm || 0) / 60;
        };

        const snap15 = (h) => Math.round(h * 4) / 4;

        // Automatic Google Calendar-style side-by-side column layout for overlapping blocks
        const layoutOverlaps = () => {
            calBody.querySelectorAll('.cal-day-col').forEach((dayCol) => {
                const items = Array.from(dayCol.querySelectorAll('.cal-event'))
                    .filter((el) => el.style.display !== 'none')
                    .map((el) => ({
                    el,
                    start: parseTimeHours(el.dataset.start),
                    end: parseTimeHours(el.dataset.end),
                }));
                items.sort((a, b) => a.start - b.start || a.end - b.end);

                // Group into connected overlap clusters
                const clusters = [];
                let current = [];
                let clusterEnd = -1;

                items.forEach((item) => {
                    if (current.length === 0 || item.start < clusterEnd) {
                        current.push(item);
                        clusterEnd = Math.max(clusterEnd, item.end);
                    } else {
                        clusters.push(current);
                        current = [item];
                        clusterEnd = item.end;
                    }
                });
                if (current.length > 0) clusters.push(current);

                clusters.forEach((cluster) => {
                    const colEnds = [];
                    cluster.forEach((item) => {
                        let col = colEnds.findIndex((endT) => endT <= item.start);
                        if (col === -1) {
                            col = colEnds.length;
                            colEnds.push(item.end);
                        } else {
                            colEnds[col] = item.end;
                        }
                        item.col = col;
                    });
                    const totalCols = colEnds.length;
                    cluster.forEach((item) => {
                        const pctW = 100 / totalCols;
                        const pctL = item.col * pctW;
                        item.el.style.left = `calc(${pctL}% + 3px)`;
                        item.el.style.width = `calc(${pctW}% - 6px)`;
                        item.el.style.right = 'auto';
                        item.el.style.margin = '0';
                    });
                });
            });
        };

        layoutOverlaps();
        syncScheduleTable();

        // Interactive Section Filter Pills
        document.querySelectorAll('.sec-filter-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sec-filter-btn').forEach((b) => b.classList.remove('is-active'));
                btn.classList.add('is-active');
                const sec = btn.dataset.secFilter;
                calBody.querySelectorAll('.cal-event').forEach((ev) => {
                    ev.style.display = sec === 'all' || ev.dataset.sec === sec ? '' : 'none';
                });
                layoutOverlaps();
        syncScheduleTable();
            });
        });

        // Registration Window Modal
        const winModal = document.getElementById('window-modal');
        const openWinBtn = document.getElementById('open-window-modal');
        const closeWinBtn = document.getElementById('window-modal-close');
        const saveWinBtn = document.getElementById('window-modal-save');
        openWinBtn?.addEventListener('click', () => winModal?.showModal());
        closeWinBtn?.addEventListener('click', () => winModal?.close());
        winModal?.addEventListener('click', (e) => { if (e.target === winModal) winModal.close(); });
        saveWinBtn?.addEventListener('click', () => {
            winModal?.close();
            showToast('Přihlašovací okno pro eventApp uloženo.');
        });

        const openForNew = (dateStr = '2027-05-15', startHour = 11, endHour = null) => {
            selectedBlock = null;
            badgeEl.textContent = 'Nový program';
            titleEl.textContent = 'Vytvořit program';
            const startS = formatHours(startHour);
            const endS = formatHours(endHour !== null ? endHour : Math.min(22, startHour + 1));
            nameInput.value = '';
            startInput.value = `${dateStr}T${startS}`;
            endInput.value = `${dateStr}T${endS}`;
            placeInput.value = '';
            capInput.value = 25;
            delBtn.style.display = 'none';
            saveBtn.innerHTML = '<i class="material-icons">add_circle</i> Vytvořit program';
            modal.showModal();
            nameInput.focus();
        };

        const openForBlock = (block) => {
            selectedBlock = block;
            badgeEl.textContent = 'Úprava programu';
            const name = block.querySelector('.cal-event-top span')?.textContent || 'Program';
            titleEl.textContent = name;
            nameInput.value = name;
            startInput.value = block.dataset.start || '2027-05-15T09:00';
            endInput.value = block.dataset.end || '2027-05-15T10:30';
            placeInput.value = block.dataset.place || '';
            capInput.value = block.dataset.cap || 25;
            if (block.dataset.sec && secSelect) secSelect.value = block.dataset.sec;
            delBtn.style.display = '';
            saveBtn.innerHTML = '<i class="material-icons">save</i> Uložit změny';
            modal.showModal();
        };

        // Prevent native browser link-drag ghost/popover on calendar blocks
        calBody.addEventListener('dragstart', (e) => e.preventDefault());

        // Drag-to-create on empty day column + Drag-to-move / Drag-to-resize on blocks
        calBody.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const block = e.target.closest('.cal-event');
            if (!block) {
                const dayCol = e.target.closest('.cal-day-col');
                if (!dayCol) return;
                e.preventDefault();

                const dayCols = Array.from(calBody.querySelectorAll('.cal-day-col'));
                const dayIdx = dayCols.indexOf(dayCol);
                const colRect = dayCol.getBoundingClientRect();
                const anchorH = Math.min(21.5, Math.max(8, snap15(8 + ((e.clientY - colRect.top) / colRect.height) * 14)));
                let rangeStart = anchorH;
                let rangeEnd = Math.min(22, anchorH + 1);
                let dragged = false;

                const preview = document.createElement('div');
                preview.className = 'cal-drag-preview';
                const updatePreview = (s, end) => {
                    preview.style.top = `calc(${(s - 8).toFixed(2)} * var(--hour-h))`;
                    preview.style.height = `calc(${(end - s).toFixed(2)} * var(--hour-h))`;
                    preview.textContent = `+ Nový program (${formatHours(s)} – ${formatHours(end)})`;
                };

                const onCreateMove = (ev) => {
                    const curH = Math.min(22, Math.max(8, snap15(8 + ((ev.clientY - colRect.top) / colRect.height) * 14)));
                    if (!dragged && Math.abs(ev.clientY - e.clientY) >= 5) {
                        dragged = true;
                        dayCol.appendChild(preview);
                    }
                    if (dragged) {
                        rangeStart = Math.min(anchorH, curH);
                        rangeEnd = Math.max(rangeStart + 0.5, Math.max(anchorH, curH));
                        updatePreview(rangeStart, rangeEnd);
                    }
                };

                const onCreateUp = () => {
                    window.removeEventListener('pointermove', onCreateMove);
                    window.removeEventListener('pointerup', onCreateUp);
                    preview.remove();
                    suppressNextClick = true;
                    setTimeout(() => { suppressNextClick = false; }, 50);
                    openForNew(dayDates[dayIdx] || '2027-05-15', rangeStart, rangeEnd);
                };

                window.addEventListener('pointermove', onCreateMove);
                window.addEventListener('pointerup', onCreateUp);
                return;
            }
            e.preventDefault();

            const isResize = Boolean(e.target.closest('.cal-resize-handle'));
            const dayCols = Array.from(calBody.querySelectorAll('.cal-day-col'));
            const bodyRect = calBody.getBoundingClientRect();
            const hourH = bodyRect.height / 14;
            const origStart = parseTimeHours(block.dataset.start);
            const origEnd = parseTimeHours(block.dataset.end);
            const duration = Math.max(0.5, origEnd - origStart);
            const startY = e.clientY;
            const startX = e.clientX;
            let moved = false;
            let targetDayIdx = dayCols.indexOf(block.closest('.cal-day-col'));
            let newStart = origStart;
            let newEnd = origEnd;

            const onMove = (ev) => {
                const dy = ev.clientY - startY;
                const dx = ev.clientX - startX;
                if (!moved && Math.hypot(dx, dy) < 5) return;
                if (!moved) {
                    moved = true;
                    block.classList.add('is-dragging');
                }

                const deltaH = snap15(dy / hourH);
                if (isResize) {
                    newStart = origStart;
                    newEnd = Math.min(22, Math.max(origStart + 0.5, origEnd + deltaH));
                } else {
                    newStart = Math.min(22 - duration, Math.max(8, origStart + deltaH));
                    newEnd = newStart + duration;
                    dayCols.forEach((col, idx) => {
                        const r = col.getBoundingClientRect();
                        if (ev.clientX >= r.left && ev.clientX <= r.right) {
                            targetDayIdx = idx;
                        }
                    });
                    if (dayCols[targetDayIdx] && block.parentElement !== dayCols[targetDayIdx]) {
                        dayCols[targetDayIdx].appendChild(block);
                        block.style.left = '4px';
                        block.style.right = '4px';
                        block.style.margin = '0';
                    }
                }

                block.style.top = `calc(${(newStart - 8).toFixed(2)} * var(--hour-h))`;
                block.style.height = `calc(${(newEnd - newStart).toFixed(2)} * var(--hour-h))`;
                const meta = block.querySelector('.cal-event-meta');
                if (meta) {
                    meta.textContent = `${formatHours(newStart)} – ${formatHours(newEnd)} · ${block.dataset.place || 'Areál'}`;
                }
            };

            const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                if (!moved) return;

                suppressNextClick = true;
                setTimeout(() => { suppressNextClick = false; }, 50);
                block.classList.remove('is-dragging');
                const dateStr = dayDates[targetDayIdx] || '2027-05-15';
                block.dataset.start = `${dateStr}T${formatHours(newStart)}`;
                block.dataset.end = `${dateStr}T${formatHours(newEnd)}`;
                layoutOverlaps();
        syncScheduleTable();
                const title = block.querySelector('.cal-event-top span')?.textContent || 'Program';
                showToast(`${title}: ${formatHours(newStart)} – ${formatHours(newEnd)}`, 'info');
            };

            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
        });

        calBody.addEventListener('click', (e) => {
            if (suppressNextClick) {
                e.preventDefault();
                return;
            }
            const block = e.target.closest('.cal-event');
            if (block) {
                e.preventDefault();
                openForBlock(block);
                return;
            }
            const dayCol = e.target.closest('.cal-day-col');
            if (dayCol) {
                const cols = Array.from(calBody.querySelectorAll('.cal-day-col'));
                const dayIdx = cols.indexOf(dayCol);
                const rect = dayCol.getBoundingClientRect();
                const relY = Math.max(0, e.clientY - rect.top);
                const hour = Math.min(20.5, Math.max(8, snap15(8 + (relY / rect.height) * 14)));
                openForNew(dayDates[dayIdx] || '2027-05-15', hour);
            }
        });

        newProgCta?.addEventListener('click', (e) => {
            e.preventDefault();
            openForNew('2027-05-15', 10);
        });

        closeBtn?.addEventListener('click', () => modal.close());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.close();
        });

        saveBtn?.addEventListener('click', () => {
            const name = nameInput.value.trim() || 'Nový program';
            const startVal = startInput.value;
            const endVal = endInput.value;
            const sec = secSelect?.value || 'outdoor';
            const place = placeInput.value.trim() || 'Areál';
            const cap = Number(capInput.value) || 20;

            const datePart = startVal.split('T')[0];
            const dayIdx = Math.max(0, dayDates.indexOf(datePart));
            const dayCol = calBody.querySelectorAll('.cal-day-col')[dayIdx];
            const startH = Math.max(8, parseTimeHours(startVal));
            const endH = Math.max(startH + 0.5, parseTimeHours(endVal));
            const timeLabel = `${startVal.split('T')[1] || '09:00'} – ${endVal.split('T')[1] || '10:30'}`;

            let target = selectedBlock;
            if (!target) {
                target = document.createElement('a');
                target.href = '#quick-edit';
                dayCol.appendChild(target);
                showToast(`Program „${name}“ vytvořen.`);
            } else {
                if (target.parentElement !== dayCol) dayCol.appendChild(target);
                showToast(`Program „${name}“ aktualizován.`);
            }

            target.className = `cal-event ${secClassMap[sec] || 'cal-sec-outdoor'}`;
            target.style.top = `calc(${(startH - 8).toFixed(2)} * var(--hour-h))`;
            target.style.height = `calc(${(endH - startH).toFixed(2)} * var(--hour-h))`;
            target.dataset.start = startVal;
            target.dataset.end = endVal;
            target.dataset.place = place;
            target.dataset.cap = String(cap);
            target.dataset.sec = sec;
            renderCalBlockContent(target, name, `0/${cap}`, timeLabel, place);
            layoutOverlaps();
        syncScheduleTable();
            modal.close();
        });

        delBtn?.addEventListener('click', () => {
            if (!selectedBlock) return;
            const name = selectedBlock.querySelector('.cal-event-top span')?.textContent || 'Program';
            selectedBlock.remove();
            selectedBlock = null;
            layoutOverlaps();
        syncScheduleTable();
            modal.close();
            showToast(`Program „${name}“ smazán.`, 'warning');
        });
    }

    // ----------------------------------------------------------------------
    // 3. Check-in Soft Block + Override + Guest Walk-in
    // ----------------------------------------------------------------------
    document.querySelectorAll('[data-action="checkin-confirm"]').forEach((confirmBtn) => {
        const container = confirmBtn.closest('.admin-card');
        if (!container) return;

        confirmBtn.addEventListener('click', () => {
            const sfhCheckbox = container.querySelector('[data-checkin-sfh]');
            const overrideBox = container.querySelector('[data-checkin-override]');
            const hasOverride = Boolean(overrideBox?.checked);

            if (sfhCheckbox && !sfhCheckbox.checked && !hasOverride) {
                showToast('Pozor: Chybí SFH kvíz! Nechte účastníka naskenovat QR, nebo zaškrtněte „Přesto odbavit (výjimka)“.', 'warning');
                return;
            }
            showToast(hasOverride && !sfhCheckbox?.checked
                ? 'Vstup odbaven s výjimkou (bez SFH).'
                : 'Vstup úspěšně odbaven! Účastník je označen jako Na místě.');
        });
    });

    // Guest table walk-in add & check-in
    const guestSection = document.getElementById('guest-checkin');
    if (guestSection) {
        const tbody = guestSection.querySelector('tbody');
        const addBtn = guestSection.querySelector('button.btn-block');
        const inputs = guestSection.querySelectorAll('form input');
        const daysSelect = guestSection.querySelector('form select');

        guestSection.addEventListener('click', (e) => {
            const btn = e.target.closest('tbody button');
            if (!btn) return;
            const row = btn.closest('tr');
            const pill = row.querySelector('.pill');
            if (btn.textContent.includes('Odbavit')) {
                pill.className = 'pill pill-ok';
                pill.textContent = 'Na místě';
                btn.className = 'btn btn-small btn-grey';
                btn.textContent = 'Odjezd';
                showToast('Host odbaven na místě.');
            } else {
                pill.className = 'pill pill-neutral';
                pill.textContent = 'Odjel';
                btn.className = 'btn btn-small btn-accent';
                btn.textContent = 'Odbavit hosta';
                showToast('Odjezd hosta zaznamenán.', 'info');
            }
        });

        addBtn?.addEventListener('click', () => {
            const name = inputs[0]?.value.trim();
            if (!name) {
                showToast('Zadejte prosím jméno hosta.', 'warning');
                inputs[0]?.focus();
                return;
            }
            const org = inputs[1]?.value.trim() || 'Návštěva';
            const days = daysSelect?.selectedOptions[0]?.textContent || 'Dnes';
            const tr = document.createElement('tr');
            const tdName = document.createElement('td');
            const b = document.createElement('b');
            b.textContent = name;
            tdName.appendChild(b);

            const tdOrg = document.createElement('td');
            tdOrg.textContent = org;

            const tdDays = document.createElement('td');
            tdDays.textContent = days;

            const tdStatus = document.createElement('td');
            const pill = document.createElement('span');
            pill.className = 'pill pill-ok';
            pill.textContent = 'Na místě';
            tdStatus.appendChild(pill);

            const tdAction = document.createElement('td');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-small btn-grey';
            btn.textContent = 'Odjezd';
            tdAction.appendChild(btn);

            tr.append(tdName, tdOrg, tdDays, tdStatus, tdAction);
            tbody.prepend(tr);
            inputs[0].value = '';
            inputs[1].value = '';
            showToast(`Host „${name}“ přidán a odbaven.`);
        });
    }

    // ----------------------------------------------------------------------
    // 4. Approvals Queue & Bank Payment Actions
    // ----------------------------------------------------------------------
    document.querySelectorAll('.master-detail').forEach((md) => {
        const tbody = md.querySelector('.data-table tbody');
        const inspector = md.querySelector('.inspector-panel');
        if (!tbody || !inspector || calBody) return;

        tbody.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            tbody.querySelectorAll('tr').forEach((r) => r.classList.remove('is-selected'));
            row.classList.add('is-selected');
            const title = row.querySelector('b')?.textContent || 'Účastník';
            const sub = row.querySelector('.text-muted')?.textContent || '';
            const h3 = inspector.querySelector('h3');
            if (h3) h3.textContent = sub ? `${title} – ${sub}` : title;
        });

        inspector.querySelectorAll('.inspector-actions button').forEach((btn) => {
            btn.addEventListener('click', () => {
                const selected = tbody.querySelector('tr.is-selected');
                if (!selected) return;
                const name = selected.querySelector('b')?.textContent || 'Registrace';
                const isApprove = btn.classList.contains('btn-accent');
                selected.remove();
                const next = tbody.querySelector('tr');
                if (next) next.click();
                showToast(isApprove ? `${name} schváleno a e-mail odeslán.` : `${name} zamítnuto.`, isApprove ? 'success' : 'warning');
            });
        });
    });

    // Save buttons feedback via explicit data-action="toast"
    document.querySelectorAll('[data-action="toast"]').forEach((btn) => {
        btn.addEventListener('click', () => {
            showToast(`Akce „${btn.textContent.trim()}“ provedena (prototyp).`);
        });
    });

    // Participant Flow: Lock Registration Modal
    const lockModal = document.getElementById('lock-modal');
    const openLockBtn = document.getElementById('open-lock-modal');
    const closeLockBtn = document.getElementById('lock-modal-close');
    const confirmLockBtn = document.getElementById('lock-modal-confirm');
    const lockGdprCheck = document.getElementById('lock-gdpr-check');
    openLockBtn?.addEventListener('click', () => lockModal?.showModal());
    closeLockBtn?.addEventListener('click', () => lockModal?.close());
    lockModal?.addEventListener('click', (e) => { if (e.target === lockModal) lockModal.close(); });
    confirmLockBtn?.addEventListener('click', () => {
        if (!lockGdprCheck?.checked) {
            showToast('Nejprve potvrďte souhlas se zpracováním údajů.', 'warning');
            return;
        }
        lockModal?.close();
        showToast('Registrace uzamčena a odeslána ke schválení!');
    });

    // Participant Flow: Add Member Modal (SkautIS quick-add + manual)
    const addMemberModal = document.getElementById('add-member-modal');
    const openAddMemberBtn = document.getElementById('open-add-member-modal');
    const closeAddMemberBtn = document.getElementById('add-member-close');
    const addMemberSubmit = document.getElementById('add-member-submit');
    const addMemberName = document.getElementById('add-member-name');
    const addMemberFood = document.getElementById('add-member-food');
    const memberTableBody = document.querySelector('#pf-member-table tbody');

    const appendMemberRow = (name, food, isSkautis) => {
        if (!memberTableBody) return;
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        const b = document.createElement('b');
        b.textContent = name;
        tdName.appendChild(b);

        const tdState = document.createElement('td');
        const pState = document.createElement('span');
        pState.className = 'pill pill-ok';
        pState.textContent = 'Kompletní';
        tdState.appendChild(pState);

        const tdSkautis = document.createElement('td');
        const pSkaut = document.createElement('span');
        pSkaut.className = isSkautis ? 'pill pill-ok' : 'pill pill-warn';
        pSkaut.textContent = isSkautis ? 'Propojeno' : 'Nepropojeno';
        tdSkautis.appendChild(pSkaut);

        const tdFood = document.createElement('td');
        tdFood.textContent = food;

        const tdAct = document.createElement('td');
        const btn = document.createElement('a');
        btn.href = '#edit-p';
        btn.className = 'btn btn-mini btn-grey';
        btn.textContent = 'Upravit';
        tdAct.appendChild(btn);

        tr.append(tdName, tdState, tdSkautis, tdFood, tdAct);
        memberTableBody.appendChild(tr);

        const count = memberTableBody.querySelectorAll('tr').length;
        const c1 = document.getElementById('pf-member-count');
        const c2 = document.getElementById('pf-member-count-head');
        const statusEl = document.getElementById('pf-member-status');
        if (c1) c1.textContent = String(count);
        if (c2) c2.textContent = String(count);
        if (statusEl && count >= 4) {
            statusEl.className = 'pill pill-ok';
            statusEl.textContent = 'Minimum splněno (4+)';
        }
    };

    openAddMemberBtn?.addEventListener('click', () => addMemberModal?.showModal());
    closeAddMemberBtn?.addEventListener('click', () => addMemberModal?.close());
    addMemberModal?.addEventListener('click', (e) => { if (e.target === addMemberModal) addMemberModal.close(); });

    addMemberModal?.querySelectorAll('[data-skautis-add]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const name = btn.dataset.skautisAdd || 'Člen';
            appendMemberRow(name, 'Normální', true);
            addMemberModal.close();
            showToast(`Člen „${name}“ přidán ze SkautISu.`);
        });
    });

    addMemberSubmit?.addEventListener('click', () => {
        const name = addMemberName?.value.trim();
        if (!name) {
            showToast('Zadejte prosím jméno člena.', 'warning');
            addMemberName?.focus();
            return;
        }
        appendMemberRow(name, addMemberFood?.value || 'Normální', false);
        addMemberName.value = '';
        addMemberModal?.close();
        showToast(`Člen „${name}“ přidán do družiny.`);
    });
    document.getElementById('pf-save-self')?.addEventListener('click', () => {
        showToast('Vaše osobní údaje byly uloženy.');
    });
})();
