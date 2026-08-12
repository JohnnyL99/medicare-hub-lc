'use strict';

const PASSWORD_HASH = '$2b$10$C6UzMDM.H6dfI/f/IKcEe.Bm2yE8o4RqWSovAitmTrH7oEktihvRy';
const SEEDED_AT = new Date('2026-08-08T09:00:00.000Z');

const specialties = [
  {
    id: 1,
    name: 'Cardiologia',
    description: 'Valutazione cardiovascolare fittizia per il Centro Medico Aurora.',
    is_active: true
  },
  {
    id: 2,
    name: 'Dermatologia',
    description: 'Prestazioni dermatologiche fittizie orientate alla prevenzione.',
    is_active: true
  },
  {
    id: 3,
    name: 'Ortopedia',
    description: 'Consulti ortopedici e valutazioni muscolo-scheletriche fittizie.',
    is_active: true
  },
  {
    id: 4,
    name: 'Pediatria',
    description: 'Visite pediatriche operative esclusivamente demo.',
    is_active: true
  },
  {
    id: 5,
    name: 'Ginecologia',
    description: 'Attivita di consultazione ginecologica simulate.',
    is_active: true
  },
  {
    id: 6,
    name: 'Endocrinologia',
    description: 'Prestazioni endocrinologiche demo con dati interamente fittizi.',
    is_active: true
  }
];

const users = [
  {
    id: 1,
    first_name: 'Aurora',
    last_name: 'Admin',
    email: 'admin@aurora.test',
    password_hash: PASSWORD_HASH,
    role: 'ADMIN',
    is_active: true
  },
  {
    id: 2,
    first_name: 'Giulia',
    last_name: 'Rossi',
    email: 'reception1@aurora.test',
    password_hash: PASSWORD_HASH,
    role: 'RECEPTIONIST',
    is_active: true
  },
  {
    id: 3,
    first_name: 'Marco',
    last_name: 'Bianchi',
    email: 'reception2@aurora.test',
    password_hash: PASSWORD_HASH,
    role: 'RECEPTIONIST',
    is_active: true
  },
  {
    id: 4,
    first_name: 'Luca',
    last_name: 'Moretti',
    email: 'doctor.luca.moretti@aurora.test',
    password_hash: PASSWORD_HASH,
    role: 'DOCTOR',
    is_active: true
  },
  {
    id: 5,
    first_name: 'Elena',
    last_name: 'Greco',
    email: 'doctor.elena.greco@aurora.test',
    password_hash: PASSWORD_HASH,
    role: 'DOCTOR',
    is_active: true
  },
  {
    id: 6,
    first_name: 'Davide',
    last_name: 'Rinaldi',
    email: 'doctor.davide.rinaldi@aurora.test',
    password_hash: PASSWORD_HASH,
    role: 'DOCTOR',
    is_active: true
  },
  {
    id: 7,
    first_name: 'Martina',
    last_name: 'Fontana',
    email: 'doctor.martina.fontana@aurora.test',
    password_hash: PASSWORD_HASH,
    role: 'DOCTOR',
    is_active: true
  },
  {
    id: 8,
    first_name: 'Sara',
    last_name: 'Conti',
    email: 'doctor.sara.conti@aurora.test',
    password_hash: PASSWORD_HASH,
    role: 'DOCTOR',
    is_active: true
  },
  {
    id: 9,
    first_name: 'Paolo',
    last_name: 'De Luca',
    email: 'doctor.paolo.deluca@aurora.test',
    password_hash: PASSWORD_HASH,
    role: 'DOCTOR',
    is_active: true
  }
].map((user) => ({
  ...user,
  created_at: SEEDED_AT,
  updated_at: SEEDED_AT
}));

const doctors = [
  {
    id: 1,
    user_id: 4,
    specialty_id: 1,
    license_number: 'AUR-MED-001',
    biography: 'Cardiologo fittizio dedicato a consulti e controlli ECG demo.',
    is_active: true
  },
  {
    id: 2,
    user_id: 5,
    specialty_id: 2,
    license_number: 'AUR-MED-002',
    biography: 'Dermatologa demo focalizzata su consulti ambulatoriali fittizi.',
    is_active: true
  },
  {
    id: 3,
    user_id: 6,
    specialty_id: 3,
    license_number: 'AUR-MED-003',
    biography: 'Ortopedico fittizio per visite e controlli posturali simulati.',
    is_active: true
  },
  {
    id: 4,
    user_id: 7,
    specialty_id: 4,
    license_number: 'AUR-MED-004',
    biography: 'Pediatra demo dedicata a controlli di routine non clinici.',
    is_active: true
  },
  {
    id: 5,
    user_id: 8,
    specialty_id: 5,
    license_number: 'AUR-MED-005',
    biography: 'Ginecologa fittizia per consulti operativi del project work.',
    is_active: true
  },
  {
    id: 6,
    user_id: 9,
    specialty_id: 6,
    license_number: 'AUR-MED-006',
    biography: 'Endocrinologo demo per visite di controllo interamente simulate.',
    is_active: true
  }
].map((doctor) => ({
  ...doctor,
  created_at: SEEDED_AT,
  updated_at: SEEDED_AT
}));

const medicalServices = [
  {
    id: 1,
    specialty_id: 1,
    name: 'Visita cardiologica',
    description: 'Consulto cardiologico fittizio di base.',
    duration_minutes: 30,
    current_price: 120,
    is_active: true
  },
  {
    id: 2,
    specialty_id: 1,
    name: 'Elettrocardiogramma',
    description: 'ECG demo con dati simulati.',
    duration_minutes: 20,
    current_price: 80,
    is_active: true
  },
  {
    id: 3,
    specialty_id: 2,
    name: 'Visita dermatologica',
    description: 'Consulto dermatologico operativo fittizio.',
    duration_minutes: 25,
    current_price: 95,
    is_active: true
  },
  {
    id: 4,
    specialty_id: 2,
    name: 'Mappatura nevi',
    description: 'Prestazione dermatologica demo per screening simulato.',
    duration_minutes: 40,
    current_price: 140,
    is_active: true
  },
  {
    id: 5,
    specialty_id: 3,
    name: 'Visita ortopedica',
    description: 'Valutazione ortopedica fittizia di primo accesso.',
    duration_minutes: 30,
    current_price: 110,
    is_active: true
  },
  {
    id: 6,
    specialty_id: 3,
    name: 'Valutazione posturale',
    description: 'Analisi posturale demo senza finalita cliniche reali.',
    duration_minutes: 45,
    current_price: 130,
    is_active: true
  },
  {
    id: 7,
    specialty_id: 4,
    name: 'Visita pediatrica',
    description: 'Controllo pediatrico di routine interamente simulato.',
    duration_minutes: 25,
    current_price: 90,
    is_active: true
  },
  {
    id: 8,
    specialty_id: 5,
    name: 'Visita ginecologica',
    description: 'Consulto ginecologico demo di base.',
    duration_minutes: 30,
    current_price: 115,
    is_active: true
  },
  {
    id: 9,
    specialty_id: 5,
    name: 'Ecografia pelvica',
    description: 'Prestazione fittizia di supporto all agenda demo.',
    duration_minutes: 35,
    current_price: 150,
    is_active: true
  },
  {
    id: 10,
    specialty_id: 6,
    name: 'Visita endocrinologica',
    description: 'Consulto endocrinologico demo per follow-up simulato.',
    duration_minutes: 30,
    current_price: 125,
    is_active: true
  },
  {
    id: 11,
    specialty_id: 6,
    name: 'Controllo metabolismo',
    description: 'Prestazione endocrinologica fittizia di controllo.',
    duration_minutes: 20,
    current_price: 85,
    is_active: true
  },
  {
    id: 12,
    specialty_id: 4,
    name: 'Bilancio pediatrico',
    description: 'Bilancio di crescita demo con dati non reali.',
    duration_minutes: 35,
    current_price: 105,
    is_active: true
  }
].map((service) => ({
  ...service,
  current_price: service.current_price.toFixed(2),
  created_at: SEEDED_AT,
  updated_at: SEEDED_AT
}));

const doctorServices = [
  [1, 1],
  [1, 2],
  [2, 3],
  [2, 4],
  [3, 5],
  [3, 6],
  [4, 7],
  [4, 12],
  [5, 8],
  [5, 9],
  [6, 10],
  [6, 11]
].map(([doctorId, medicalServiceId]) => ({
  doctor_id: doctorId,
  medical_service_id: medicalServiceId,
  created_at: SEEDED_AT,
  updated_at: SEEDED_AT
}));

const availabilities = [
  [1, 1, '09:00:00', '13:00:00'],
  [1, 3, '09:00:00', '13:00:00'],
  [1, 5, '14:00:00', '18:00:00'],
  [2, 2, '09:00:00', '13:00:00'],
  [2, 4, '09:00:00', '13:00:00'],
  [2, 6, '09:00:00', '12:00:00'],
  [3, 1, '14:00:00', '18:00:00'],
  [3, 3, '14:00:00', '18:00:00'],
  [3, 5, '09:00:00', '13:00:00'],
  [4, 2, '14:00:00', '18:00:00'],
  [4, 4, '14:00:00', '18:00:00'],
  [4, 5, '09:00:00', '12:00:00'],
  [5, 1, '09:00:00', '12:00:00'],
  [5, 3, '14:00:00', '18:00:00'],
  [5, 6, '09:00:00', '13:00:00'],
  [6, 2, '09:00:00', '12:00:00'],
  [6, 4, '14:00:00', '18:00:00'],
  [6, 6, '10:00:00', '13:00:00']
].map(([doctorId, weekday, startTime, endTime], index) => ({
  id: index + 1,
  doctor_id: doctorId,
  weekday,
  start_time: startTime,
  end_time: endTime,
  is_active: true,
  created_at: SEEDED_AT,
  updated_at: SEEDED_AT
}));

const patientBase = [
  ['Anna', 'Ferri', '1984-02-14', 'anna.ferri@patients.test', '3201000001', 'FKEANN84B54A001A'],
  ['Matteo', 'Leone', '1978-11-03', 'matteo.leone@patients.test', '3201000002', 'FKEMTT78S03A002B'],
  ['Chiara', 'Marini', '1991-07-22', 'chiara.marini@patients.test', '3201000003', null],
  ['Giorgio', 'Vitali', '1969-04-09', 'giorgio.vitali@patients.test', '3201000004', 'FKEGRG69D09A004C'],
  ['Irene', 'De Santis', '1988-12-18', 'irene.desantis@patients.test', '3201000005', 'FKEIRN88T58A005D'],
  ['Fabio', 'Neri', '1975-06-01', 'fabio.neri@patients.test', '3201000006', null],
  ['Laura', 'Caruso', '1993-03-27', 'laura.caruso@patients.test', '3201000007', 'FKELRA93C67A007E'],
  ['Michele', 'Serra', '1981-09-12', 'michele.serra@patients.test', '3201000008', 'FKEMCH81P12A008F'],
  ['Valentina', 'Riva', '1996-01-30', 'valentina.riva@patients.test', '3201000009', null],
  ['Stefano', 'Grassi', '1985-05-15', 'stefano.grassi@patients.test', '3201000010', 'FKESTF85E15A010G'],
  ['Federica', 'Romano', '1990-08-04', 'federica.romano@patients.test', '3201000011', 'FKEFDR90M44A011H'],
  ['Alessio', 'Colombo', '1972-10-20', 'alessio.colombo@patients.test', '3201000012', null],
  ['Simona', 'Bellini', '1987-02-08', 'simona.bellini@patients.test', '3201000013', 'FKESMN87B48A013I'],
  ['Riccardo', 'Galli', '1994-06-16', 'riccardo.galli@patients.test', '3201000014', 'FKERCR94H16A014L'],
  ['Elisa', 'Pellegrini', '1979-09-29', 'elisa.pellegrini@patients.test', '3201000015', null],
  ['Tommaso', 'Villa', '1983-12-06', 'tommaso.villa@patients.test', '3201000016', 'FKETMS83T06A016M'],
  ['Marta', 'Costa', '1998-07-11', 'marta.costa@patients.test', '3201000017', 'FKEMRT98L51A017N'],
  ['Lorenzo', 'Giordano', '1967-03-19', 'lorenzo.giordano@patients.test', '3201000018', null],
  ['Beatrice', 'Sanna', '1986-11-24', 'beatrice.sanna@patients.test', '3201000019', 'FKEBRC86S64A019P'],
  ['Nicolo', 'Parisi', '1992-04-13', 'nicolo.parisi@patients.test', '3201000020', 'FKENCL92D13A020Q'],
  ['Camilla', 'Longo', '2000-05-02', 'camilla.longo@patients.test', '3201000021', null],
  ['Andrea', 'Barbieri', '1977-08-26', 'andrea.barbieri@patients.test', '3201000022', 'FKEAND77M26A022R'],
  ['Serena', 'Lombardi', '1989-01-17', 'serena.lombardi@patients.test', '3201000023', 'FKESRN89A57A023S'],
  ['Diego', 'Ricci', '1995-10-31', 'diego.ricci@patients.test', '3201000024', null],
  ['Noemi', 'Farina', '1982-07-05', 'noemi.farina@patients.test', '3201000025', 'FKENMI82L45A025T'],
  ['Edoardo', 'Martini', '1974-02-21', 'edoardo.martini@patients.test', '3201000026', 'FKEEDR74B21A026U'],
  ['Arianna', 'Silvestri', '1997-09-09', 'arianna.silvestri@patients.test', '3201000027', null],
  ['Gabriele', 'Bianco', '1980-06-28', 'gabriele.bianco@patients.test', '3201000028', 'FKEGBR80H28A028V'],
  ['Martina', 'Rossetti', '1999-12-12', 'martina.rossetti@patients.test', '3201000029', 'FKEMTN99T52A029W'],
  ['Pietro', 'Damiani', '1971-03-08', 'pietro.damiani@patients.test', '3201000030', null]
];

const patients = patientBase.map((patient, index) => ({
  id: index + 1,
  first_name: patient[0],
  last_name: patient[1],
  birth_date: patient[2],
  email: patient[3],
  phone: patient[4],
  fiscal_code: patient[5],
  is_active: true,
  created_at: SEEDED_AT,
  updated_at: SEEDED_AT
}));

const doctorSchedules = {
  1: ['2026-07-13T08:00:00Z', '2026-07-15T09:00:00Z', '2026-07-17T13:00:00Z', '2026-08-10T08:00:00Z', '2026-08-12T09:00:00Z', '2026-09-14T08:00:00Z', '2026-09-16T09:00:00Z'],
  2: ['2026-07-14T08:30:00Z', '2026-07-16T08:00:00Z', '2026-07-18T08:00:00Z', '2026-08-11T08:30:00Z', '2026-08-13T08:00:00Z', '2026-09-15T08:30:00Z', '2026-09-17T08:00:00Z'],
  3: ['2026-07-13T13:00:00Z', '2026-07-15T13:30:00Z', '2026-07-17T08:30:00Z', '2026-08-10T13:00:00Z', '2026-08-12T13:30:00Z', '2026-09-14T13:00:00Z', '2026-09-16T13:30:00Z'],
  4: ['2026-07-14T13:00:00Z', '2026-07-16T13:30:00Z', '2026-07-17T08:00:00Z', '2026-08-11T13:00:00Z', '2026-08-13T13:30:00Z', '2026-09-15T13:00:00Z', '2026-09-17T13:30:00Z'],
  5: ['2026-07-13T08:30:00Z', '2026-07-15T13:00:00Z', '2026-07-18T08:30:00Z', '2026-08-10T08:30:00Z', '2026-08-12T13:00:00Z', '2026-09-14T08:30:00Z', '2026-09-16T13:00:00Z'],
  6: ['2026-07-14T08:00:00Z', '2026-07-16T13:00:00Z', '2026-07-18T09:00:00Z', '2026-08-11T08:00:00Z', '2026-08-13T13:00:00Z', '2026-09-15T08:00:00Z', '2026-09-17T13:00:00Z']
};

const serviceDurations = {
  1: 30,
  2: 20,
  3: 25,
  4: 40,
  5: 30,
  6: 45,
  7: 25,
  8: 30,
  9: 35,
  10: 30,
  11: 20,
  12: 35
};

const servicePrices = {
  1: '120.00',
  2: '80.00',
  3: '95.00',
  4: '140.00',
  5: '110.00',
  6: '130.00',
  7: '90.00',
  8: '115.00',
  9: '150.00',
  10: '125.00',
  11: '85.00',
  12: '105.00'
};

const doctorServiceMap = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
  4: [7, 12],
  5: [8, 9],
  6: [10, 11]
};

const statusPattern = [
  'COMPLETED',
  'COMPLETED',
  'NO_SHOW',
  'CONFIRMED',
  'SCHEDULED',
  'CANCELLED',
  'SCHEDULED'
];

function buildAppointments() {
  const appointments = [];
  let appointmentId = 1;
  let patientCursor = 1;

  Object.entries(doctorSchedules).forEach(([doctorKey, slots]) => {
    const doctorId = Number(doctorKey);
    const serviceIds = doctorServiceMap[doctorId];

    slots.forEach((scheduledAt, slotIndex) => {
      const serviceId = serviceIds[slotIndex % serviceIds.length];
      const duration = serviceDurations[serviceId];
      const endAt = new Date(new Date(scheduledAt).getTime() + duration * 60000);
      const createdBy = [1, 2, 3][slotIndex % 3];
      const patientId = patientCursor;
      patientCursor = patientCursor === 30 ? 1 : patientCursor + 1;
      const status = statusPattern[slotIndex];

      appointments.push({
        id: appointmentId,
        patient_id: patientId,
        doctor_id: doctorId,
        medical_service_id: serviceId,
        scheduled_at: new Date(scheduledAt),
        end_at: endAt,
        duration_minutes_snapshot: duration,
        price_snapshot: servicePrices[serviceId],
        status,
        operational_notes:
          status === 'CANCELLED'
            ? 'Annullato dalla segreteria per indisponibilita del paziente.'
            : status === 'NO_SHOW'
              ? 'Assenza registrata senza note cliniche.'
              : 'Promemoria operativo demo per il personale di front office.',
        created_by: createdBy,
        created_at: new Date(new Date(scheduledAt).getTime() - 10 * 24 * 60 * 60000),
        updated_at: new Date(new Date(scheduledAt).getTime() - 9 * 24 * 60 * 60000)
      });

      appointmentId += 1;
    });
  });

  return appointments;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkInsert('specialties', specialties.map((item) => ({
        ...item,
        created_at: SEEDED_AT,
        updated_at: SEEDED_AT
      })), { transaction });
      await queryInterface.bulkInsert('users', users, { transaction });
      await queryInterface.bulkInsert('doctors', doctors, { transaction });
      await queryInterface.bulkInsert('patients', patients, { transaction });
      await queryInterface.bulkInsert('medical_services', medicalServices, { transaction });
      await queryInterface.bulkInsert('doctor_services', doctorServices, { transaction });
      await queryInterface.bulkInsert('availabilities', availabilities, { transaction });
      await queryInterface.bulkInsert('appointments', buildAppointments(), { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete('appointments', null, { transaction });
      await queryInterface.bulkDelete('availabilities', null, { transaction });
      await queryInterface.bulkDelete('doctor_services', null, { transaction });
      await queryInterface.bulkDelete('medical_services', null, { transaction });
      await queryInterface.bulkDelete('patients', null, { transaction });
      await queryInterface.bulkDelete('doctors', null, { transaction });
      await queryInterface.bulkDelete('users', null, { transaction });
      await queryInterface.bulkDelete('specialties', null, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
