document.addEventListener('DOMContentLoaded', () => {
  const cardBtn = document.getElementById('card-view-button');
  const calendarBtn = document.getElementById('calendar-view-button');
  const activitiesList = document.getElementById('activities-list');
  const calendarView = document.getElementById('calendar-view');
  const calendarContainer = document.getElementById('calendar-container');

  function showCardView() {
    cardBtn.classList.add('active');
    calendarBtn.classList.remove('active');
    activitiesList.classList.remove('hidden');
    calendarView.classList.add('hidden');
  }

  function showCalendarView() {
    cardBtn.classList.remove('active');
    calendarBtn.classList.add('active');
    activitiesList.classList.add('hidden');
    calendarView.classList.remove('hidden');
    // Load mock data and render
    loadAndRenderCalendar();
  }

  cardBtn.addEventListener('click', showCardView);
  calendarBtn.addEventListener('click', showCalendarView);

  async function loadAndRenderCalendar() {
    if (calendarContainer.dataset.rendered === 'true') return;
    try {
      const res = await fetch('mock-activities.json');
      const data = await res.json();
      renderCalendar(data);
      calendarContainer.dataset.rendered = 'true';
    } catch (err) {
      calendarContainer.innerHTML = '<p>Failed to load calendar demo data.</p>';
      console.error('Calendar load error', err);
    }
  }

  function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function renderCalendar(activities) {
    // configuration
    const startHour = 6; // 06:00
    const endHour = 20; // 20:00
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    // build grid container
    calendarContainer.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    // time column
    const timeCol = document.createElement('div');
    timeCol.className = 'time-column';
    for (let h = startHour; h <= endHour; h++) {
      const label = document.createElement('div');
      label.className = 'time-label';
      label.textContent = `${h}:00`;
      timeCol.appendChild(label);
    }
    grid.appendChild(timeCol);

    // day columns
    const daysWrapper = document.createElement('div');
    daysWrapper.className = 'days-wrapper';

    // build events by day
    const eventsByDay = {};
    Object.entries(activities).forEach(([name, details]) => {
      if (!details.schedule_details) return;
      const days = details.schedule_details.days || [];
      days.forEach((d) => {
        eventsByDay[d] = eventsByDay[d] || [];
        eventsByDay[d].push({
          name,
          start: details.schedule_details.start_time,
          end: details.schedule_details.end_time,
          color: '#6fbf73',
          description: details.description || ''
        });
      });
    });

    dayNames.forEach((day) => {
      const col = document.createElement('div');
      col.className = 'day-column';
      const header = document.createElement('div');
      header.className = 'day-header';
      header.textContent = day;
      col.appendChild(header);

      const slot = document.createElement('div');
      slot.className = 'day-slot';

      const dayEvents = eventsByDay[day] || [];

      // compute overlap groups
      const positioned = [];
      dayEvents.sort((a,b) => timeToMinutes(a.start) - timeToMinutes(b.start));
      dayEvents.forEach((ev) => {
        // find a column for it
        let placed = false;
        for (let i = 0; i < positioned.length; i++) {
          const colGroup = positioned[i];
          // check last event in this column doesn't overlap
          const last = colGroup[colGroup.length - 1];
          if (timeToMinutes(ev.start) >= timeToMinutes(last.end)) {
            colGroup.push(ev);
            placed = true;
            break;
          }
        }
        if (!placed) {
          positioned.push([ev]);
        }
      });

      // Now flatten positioned columns into display columns for overlapping layout
      // For rendering, we need list of all events with column index and total cols
      const eventsForRender = [];
      // Convert positioned columns into events with column index
      positioned.forEach((colGroup, colIndex) => {
        colGroup.forEach((ev) => {
          eventsForRender.push({ ev, colIndex, totalCols: positioned.length });
        });
      });

      // render each event
      eventsForRender.forEach(({ev, colIndex, totalCols}) => {
        const evEl = document.createElement('div');
        evEl.className = 'calendar-event';
        const dayStart = startHour * 60;
        const evStart = timeToMinutes(ev.start);
        const evEnd = timeToMinutes(ev.end);
        const topPercent = ((evStart - dayStart) / ((endHour - startHour)*60)) * 100;
        const heightPercent = ((evEnd - evStart) / ((endHour - startHour)*60)) * 100;
        evEl.style.top = topPercent + '%';
        evEl.style.height = heightPercent + '%';
        evEl.style.width = (100 / totalCols) + '%';
        evEl.style.left = (colIndex * (100 / totalCols)) + '%';
        evEl.style.background = ev.color;
        evEl.innerHTML = `<div class="event-title">${ev.name}</div><div class="event-time">${ev.start} - ${ev.end}</div>`;
        evEl.title = ev.description || '';
        slot.appendChild(evEl);
      });

      col.appendChild(slot);
      daysWrapper.appendChild(col);
    });

    grid.appendChild(daysWrapper);
    calendarContainer.appendChild(grid);
  }

  // initialize: show card view by default
  showCardView();
});
