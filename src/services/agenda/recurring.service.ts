import { Timestamp } from 'firebase/firestore';
import { AgendaEvent, RecurringConfig, RecurringType } from '../../types';

export class RecurringEventService {
  // Génère les instances d'événements récurrents
  static generateRecurringInstances(
    baseEvent: AgendaEvent,
    startDate: Date,
    endDate: Date
  ): AgendaEvent[] {
    if (!baseEvent.recurring) return [baseEvent];

    const instances: AgendaEvent[] = [];
    const config = baseEvent.recurring;
    const eventStart = baseEvent.startDate.toDate();
    
    let currentDate = new Date(Math.max(eventStart.getTime(), startDate.getTime()));
    const maxDate = endDate;
    const configEndDate = config.endDate?.toDate();
    
    let count = 0;
    const maxCount = config.count || 365; // Limite de sécurité

    while (currentDate <= maxDate && count < maxCount) {
      // Vérifier si cette date est une exception
      const isException = config.exceptions?.some(
        exception => this.isSameDay(exception.toDate(), currentDate)
      );

      if (!isException) {
        // Créer une instance de l'événement
        const instance: AgendaEvent = {
          ...baseEvent,
          id: `${baseEvent.id}_${currentDate.toISOString().split('T')[0]}`,
          startDate: Timestamp.fromDate(currentDate),
          recurrenceId: baseEvent.id,
        };

        // Ajuster l'heure de fin si nécessaire
        if (baseEvent.endDate) {
          const originalDuration = baseEvent.endDate.toDate().getTime() - baseEvent.startDate.toDate().getTime();
          instance.endDate = Timestamp.fromDate(new Date(currentDate.getTime() + originalDuration));
        }

        instances.push(instance);
      }

      // Calculer la prochaine occurrence
      currentDate = this.getNextOccurrence(currentDate, config);
      count++;

      // Vérifier la date de fin de configuration
      if (configEndDate && currentDate > configEndDate) {
        break;
      }
    }

    return instances;
  }

  // Calcule la prochaine occurrence selon la configuration
  private static getNextOccurrence(currentDate: Date, config: RecurringConfig): Date {
    const nextDate = new Date(currentDate);

    switch (config.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + config.interval);
        break;

      case 'weekly':
        if (config.daysOfWeek && config.daysOfWeek.length > 0) {
          // Récurrence sur des jours spécifiques de la semaine
          const currentDay = nextDate.getDay();
          const sortedDays = [...config.daysOfWeek].sort((a, b) => a - b);
          
          let nextDay = sortedDays.find(day => day > currentDay);
          if (!nextDay) {
            // Passer à la semaine suivante
            nextDay = sortedDays[0];
            nextDate.setDate(nextDate.getDate() + (7 * config.interval));
          }
          
          const daysToAdd = nextDay - currentDay;
          nextDate.setDate(nextDate.getDate() + daysToAdd);
        } else {
          // Récurrence hebdomadaire simple
          nextDate.setDate(nextDate.getDate() + (7 * config.interval));
        }
        break;

      case 'monthly':
        if (config.dayOfMonth) {
          // Jour spécifique du mois
          nextDate.setMonth(nextDate.getMonth() + config.interval);
          nextDate.setDate(config.dayOfMonth);
        } else {
          // Même jour du mois
          const originalDay = nextDate.getDate();
          nextDate.setMonth(nextDate.getMonth() + config.interval);
          
          // Gérer les mois avec moins de jours
          const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
          if (originalDay > lastDayOfMonth) {
            nextDate.setDate(lastDayOfMonth);
          } else {
            nextDate.setDate(originalDay);
          }
        }
        break;

      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + config.interval);
        break;

      case 'custom':
        // Pour les récurrences personnalisées, utiliser l'intervalle en jours
        nextDate.setDate(nextDate.getDate() + config.interval);
        break;
    }

    return nextDate;
  }

  // Vérifie si deux dates sont le même jour
  private static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  // Valide une configuration de récurrence
  static validateRecurringConfig(config: RecurringConfig): string[] {
    const errors: string[] = [];

    if (config.interval <= 0) {
      errors.push('L\'intervalle doit être supérieur à 0');
    }

    if (config.type === 'weekly' && config.daysOfWeek) {
      const invalidDays = config.daysOfWeek.filter(day => day < 0 || day > 6);
      if (invalidDays.length > 0) {
        errors.push('Les jours de la semaine doivent être entre 0 et 6');
      }
    }

    if (config.type === 'monthly' && config.dayOfMonth) {
      if (config.dayOfMonth < 1 || config.dayOfMonth > 31) {
        errors.push('Le jour du mois doit être entre 1 et 31');
      }
    }

    if (config.endDate && config.count) {
      errors.push('Vous ne pouvez pas spécifier à la fois une date de fin et un nombre d\'occurrences');
    }

    return errors;
  }

  // Crée une configuration de récurrence par défaut
  static createDefaultConfig(type: RecurringType): RecurringConfig {
    const config: RecurringConfig = {
      type,
      interval: 1,
    };

    switch (type) {
      case 'weekly':
        config.daysOfWeek = [new Date().getDay()]; // Jour actuel
        break;
      case 'monthly':
        config.dayOfMonth = new Date().getDate(); // Jour actuel du mois
        break;
    }

    return config;
  }

  // Calcule le nombre d'événements multi-jours
  static isMultiDayEvent(startDate: Date, endDate?: Date): boolean {
    if (!endDate) return false;
    
    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return end.getTime() > start.getTime();
  }

  // Génère les jours pour un événement multi-jours
  static generateMultiDayDates(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  // Formate la description de la récurrence
  static formatRecurrenceDescription(config: RecurringConfig): string {
    const { type, interval } = config;

    switch (type) {
      case 'daily':
        return interval === 1 ? 'Tous les jours' : `Tous les ${interval} jours`;
      
      case 'weekly':
        if (config.daysOfWeek && config.daysOfWeek.length > 0) {
          const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
          const days = config.daysOfWeek.map(day => dayNames[day]).join(', ');
          return interval === 1 ? `Chaque ${days}` : `Tous les ${interval} semaines le ${days}`;
        }
        return interval === 1 ? 'Chaque semaine' : `Tous les ${interval} semaines`;
      
      case 'monthly':
        if (config.dayOfMonth) {
          return interval === 1 
            ? `Le ${config.dayOfMonth} de chaque mois`
            : `Le ${config.dayOfMonth} tous les ${interval} mois`;
        }
        return interval === 1 ? 'Chaque mois' : `Tous les ${interval} mois`;
      
      case 'yearly':
        return interval === 1 ? 'Chaque année' : `Tous les ${interval} ans`;
      
      case 'custom':
        return `Tous les ${interval} jours`;
      
      default:
        return 'Récurrence personnalisée';
    }
  }
}
