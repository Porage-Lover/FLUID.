import { performance } from 'perf_hooks';

function generateLocalTimetableBaseline(attendanceData: any[], isBatchTwo: boolean) {
    const days: any = { "1": [], "2": [], "3": [], "4": [], "5": [] };

    // Pre-process attendanceData into a slot map for O(1) lookup
    const slotMap = new Map<string, any>();
    attendanceData.forEach(subj => {
      if (subj.slot) {
        if (subj.slot.includes('-')) {
          subj.slot.split('-').forEach((s: string) => {
            if (!slotMap.has(s)) slotMap.set(s, subj);
          });
        } else {
          if (!slotMap.has(subj.slot)) slotMap.set(subj.slot, subj);
        }
      }
    });

    const batch1Raw = [
      ["A", "A", "F", "F", "G", "P6", "P7", "P8", "P9", "P10"],
      ["P11", "P12", "P13", "P14", "P15", "B", "B", "G", "G", "A"],
      ["C", "C", "A", "D", "B", "P26", "P27", "P28", "P29", "P30"],
      ["P31", "P32", "P33", "P34", "P35", "D", "D", "B", "E", "C"],
      ["E", "E", "C", "F", "D", "P46", "P47", "P48", "P49", "P50"]
    ];

    // Quick time string mapping assuming 8AM root shift natively expanded terminating precisely at 4:50
    const tms = ["08:00 AM", "08:50 AM", "09:40 AM", "10:45 AM", "11:35 AM", "12:30 PM", "01:20 PM", "02:15 PM", "03:10 PM", "04:00 PM", "04:50 PM"];

    const activeBatch = isBatchTwo ? [
      ["P1", "P2", "P3", "P4", "P5", "A", "A", "F", "F", "G"],
      ["B", "B", "G", "G", "A", "P16", "P17", "P18", "P19", "P20"],
      ["P21", "P22", "P23", "P24", "P25", "C", "C", "A", "D", "B"],
      ["D", "D", "B", "E", "C", "P36", "P37", "P38", "P39", "P40"],
      ["P41", "P42", "P43", "P44", "P45", "E", "E", "C", "F", "D"]
    ] : batch1Raw;

    // Loop through the days
    activeBatch.forEach((daySlots, dayIndex) => {
       const dayNumber = (dayIndex + 1).toString();

       daySlots.forEach((slotRef, slotIdx) => {
           // Search through attendance data for someone enrolled in this specific slot
           const matchingSubject = slotMap.get(slotRef);

           if (matchingSubject) {
              const etIdx = slotIdx + 1 < tms.length ? slotIdx + 1 : slotIdx;
              days[dayNumber].push({
                 code: matchingSubject.code,
                 name: matchingSubject.name,
                 room: "Campus",
                 type: slotRef.startsWith("P") ? "Practical" : "Theory",
                 st: tms[slotIdx],
                 et: tms[etIdx]
              });
           }
       });

       // Force Custom User Timetable Injections natively filling API voids
       if (dayNumber === '4') {
          const dbmsId = attendanceData.find(s => s.name?.toLowerCase().includes('database management systems'));
          if (dbmsId) {
             days['4'] = days['4'].filter((c: any) => !(c.st === '08:00 AM' || c.st === '08:50 AM'));
             days['4'].unshift(
                { code: dbmsId.code, name: dbmsId.name, room: 'LAB', type: 'Practical', st: '08:00 AM', et: '08:50 AM' },
                { code: dbmsId.code, name: dbmsId.name, room: 'LAB', type: 'Practical', st: '08:50 AM', et: '09:40 AM' }
             );
          }
       }

       if (dayNumber === '5') {
          const daaId = attendanceData.find(s => s.name?.toLowerCase().includes('design and analysis') && (s.category?.toLowerCase() === 'practical' || s.name?.toLowerCase().includes('practical')));
          if (daaId) {
             days['5'] = days['5'].filter((c: any) => !(c.st === '08:00 AM' || c.st === '08:50 AM'));
             days['5'].unshift(
                { code: daaId.code, name: daaId.name, room: daaId.room || 'LAB', type: 'Practical', st: '08:00 AM', et: '08:50 AM' },
                { code: daaId.code, name: daaId.name, room: daaId.room || 'LAB', type: 'Practical', st: '08:50 AM', et: '09:40 AM' }
             );
          }
       }
    });

    return days;
}

function generateLocalTimetableOptimized(attendanceData: any[], isBatchTwo: boolean) {
    const days: any = { "1": [], "2": [], "3": [], "4": [], "5": [] };

    // Pre-process attendanceData into a slot map for O(1) lookup
    const slotMap = new Map<string, any>();

    let dbmsId: any = null;
    let daaId: any = null;

    attendanceData.forEach(subj => {
      // Find DBMS
      if (!dbmsId && subj.name?.toLowerCase().includes('database management systems')) {
         dbmsId = subj;
      }
      // Find DAA
      if (!daaId && subj.name?.toLowerCase().includes('design and analysis') && (subj.category?.toLowerCase() === 'practical' || subj.name?.toLowerCase().includes('practical'))) {
         daaId = subj;
      }

      if (subj.slot) {
        if (subj.slot.includes('-')) {
          subj.slot.split('-').forEach((s: string) => {
            if (!slotMap.has(s)) slotMap.set(s, subj);
          });
        } else {
          if (!slotMap.has(subj.slot)) slotMap.set(subj.slot, subj);
        }
      }
    });

    const batch1Raw = [
      ["A", "A", "F", "F", "G", "P6", "P7", "P8", "P9", "P10"],
      ["P11", "P12", "P13", "P14", "P15", "B", "B", "G", "G", "A"],
      ["C", "C", "A", "D", "B", "P26", "P27", "P28", "P29", "P30"],
      ["P31", "P32", "P33", "P34", "P35", "D", "D", "B", "E", "C"],
      ["E", "E", "C", "F", "D", "P46", "P47", "P48", "P49", "P50"]
    ];

    // Quick time string mapping assuming 8AM root shift natively expanded terminating precisely at 4:50
    const tms = ["08:00 AM", "08:50 AM", "09:40 AM", "10:45 AM", "11:35 AM", "12:30 PM", "01:20 PM", "02:15 PM", "03:10 PM", "04:00 PM", "04:50 PM"];

    const activeBatch = isBatchTwo ? [
      ["P1", "P2", "P3", "P4", "P5", "A", "A", "F", "F", "G"],
      ["B", "B", "G", "G", "A", "P16", "P17", "P18", "P19", "P20"],
      ["P21", "P22", "P23", "P24", "P25", "C", "C", "A", "D", "B"],
      ["D", "D", "B", "E", "C", "P36", "P37", "P38", "P39", "P40"],
      ["P41", "P42", "P43", "P44", "P45", "E", "E", "C", "F", "D"]
    ] : batch1Raw;

    // Loop through the days
    activeBatch.forEach((daySlots, dayIndex) => {
       const dayNumber = (dayIndex + 1).toString();

       daySlots.forEach((slotRef, slotIdx) => {
           // Search through attendance data for someone enrolled in this specific slot
           const matchingSubject = slotMap.get(slotRef);

           if (matchingSubject) {
              const etIdx = slotIdx + 1 < tms.length ? slotIdx + 1 : slotIdx;
              days[dayNumber].push({
                 code: matchingSubject.code,
                 name: matchingSubject.name,
                 room: "Campus",
                 type: slotRef.startsWith("P") ? "Practical" : "Theory",
                 st: tms[slotIdx],
                 et: tms[etIdx]
              });
           }
       });

       // Force Custom User Timetable Injections natively filling API voids
       if (dayNumber === '4') {
          if (dbmsId) {
             days['4'] = days['4'].filter((c: any) => !(c.st === '08:00 AM' || c.st === '08:50 AM'));
             days['4'].unshift(
                { code: dbmsId.code, name: dbmsId.name, room: 'LAB', type: 'Practical', st: '08:00 AM', et: '08:50 AM' },
                { code: dbmsId.code, name: dbmsId.name, room: 'LAB', type: 'Practical', st: '08:50 AM', et: '09:40 AM' }
             );
          }
       }

       if (dayNumber === '5') {
          if (daaId) {
             days['5'] = days['5'].filter((c: any) => !(c.st === '08:00 AM' || c.st === '08:50 AM'));
             days['5'].unshift(
                { code: daaId.code, name: daaId.name, room: daaId.room || 'LAB', type: 'Practical', st: '08:00 AM', et: '08:50 AM' },
                { code: daaId.code, name: daaId.name, room: daaId.room || 'LAB', type: 'Practical', st: '08:50 AM', et: '09:40 AM' }
             );
          }
       }
    });

    return days;
}

// Generate large mock data (e.g. 1000 items)
const mockData: any[] = [];
for (let i = 0; i < 50000; i++) {
   mockData.push({
      name: `Subject ${i}`,
      category: 'theory',
      slot: i % 2 === 0 ? 'A' : `P${i % 50}`,
      code: `CS${i}`
   });
}
// Add the ones we look for at the very end to maximize search time
mockData.push({
   name: 'database management systems',
   category: 'practical',
   slot: 'B',
   code: 'CSDBMS'
});
mockData.push({
   name: 'design and analysis of algorithms practical',
   category: 'practical',
   slot: 'C',
   code: 'CSDAA'
});

const iterations = 100;

let baselineTotal = 0;
for (let i = 0; i < iterations; i++) {
   const start = performance.now();
   generateLocalTimetableBaseline(mockData, false);
   baselineTotal += performance.now() - start;
}

let optimizedTotal = 0;
for (let i = 0; i < iterations; i++) {
   const start = performance.now();
   generateLocalTimetableOptimized(mockData, false);
   optimizedTotal += performance.now() - start;
}

console.log(`Baseline Avg: ${(baselineTotal / iterations).toFixed(2)} ms`);
console.log(`Optimized Avg: ${(optimizedTotal / iterations).toFixed(2)} ms`);
console.log(`Improvement: ${(((baselineTotal - optimizedTotal) / baselineTotal) * 100).toFixed(2)}%`);
