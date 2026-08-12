import { Appointment } from './Appointment.js';
import { Availability } from './Availability.js';
import { Doctor } from './Doctor.js';
import { DoctorService } from './DoctorService.js';
import { MedicalService } from './MedicalService.js';
import { Patient } from './Patient.js';
import { Specialty } from './Specialty.js';
import { User } from './User.js';

export function initModels(sequelize) {
  const models = {
    User: User.initModel(sequelize),
    Specialty: Specialty.initModel(sequelize),
    Doctor: Doctor.initModel(sequelize),
    Patient: Patient.initModel(sequelize),
    MedicalService: MedicalService.initModel(sequelize),
    DoctorService: DoctorService.initModel(sequelize),
    Availability: Availability.initModel(sequelize),
    Appointment: Appointment.initModel(sequelize)
  };

  Object.values(models).forEach((model) => {
    if (typeof model.associate === 'function') {
      model.associate(models);
    }
  });

  return models;
}
