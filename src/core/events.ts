export interface BootstrapEvent {
  app: any
}

export interface ServeEvent {
  app: any
  router: any
}

export interface TerminateEvent {
  app: any
}

export interface ModelEvent {
  app: any
  model: any
}

export interface ModelErrorEvent extends ModelEvent {
  error: Error
}

export interface RecordEvent {
  app: any
  record: any
}

export interface RecordErrorEvent extends RecordEvent {
  error: Error
}

export interface RecordEnrichEvent {
  app: any
  record: any
  requestInfo: any
}

export interface CollectionEvent {
  app: any
  collection: any
}

export interface BackupEvent {
  app: any
  name: string
}


