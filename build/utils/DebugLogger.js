import { Platform } from 'react-native';
import { privacyFilter } from './debug/PrivacyFilter';
// Conditionally import dependencies that might not be available
let RNFS = null;
let DeviceInfo = null;
try {
    RNFS = require('react-native-fs');
}
catch (error) {
    console.warn('RNFS not available, file logging disabled:', error);
}
try {
    DeviceInfo = require('react-native-device-info');
}
catch (error) {
    console.warn('DeviceInfo not available, device info disabled:', error);
}
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["VERBOSE"] = 0] = "VERBOSE";
    LogLevel[LogLevel["DEBUG"] = 1] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 5] = "FATAL";
})(LogLevel || (LogLevel = {}));
export class DebugLogger {
    static getInstance() {
        if (!DebugLogger.instance) {
            DebugLogger.instance = new DebugLogger();
        }
        return DebugLogger.instance;
    }
    constructor() {
        this.logBuffer = [];
        this.currentLogLevel = LogLevel.DEBUG;
        this.maxBufferSize = 1000;
        this.flushInterval = null;
        this.deviceInfo = null;
        this.sessionId = this.generateSessionId();
        this.fileWriter = new FileWriter();
        this.setupCrashHandling();
        this.loadConfiguration();
        this.initializeDeviceInfo();
        this.startFlushInterval();
        console.log('🐛 DebugLogger initialized with session:', this.sessionId);
    }
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    async initializeDeviceInfo() {
        if (!DeviceInfo) {
            console.warn('DeviceInfo not available, using fallback device info');
            this.deviceInfo = {
                brand: 'unknown',
                model: 'unknown',
                systemVersion: 'unknown',
                appVersion: '1.0.0',
                buildNumber: '1',
                uniqueId: `fallback-${Date.now()}`
            };
            return;
        }
        try {
            this.deviceInfo = {
                brand: await DeviceInfo.getBrand(),
                model: await DeviceInfo.getModel(),
                systemVersion: await DeviceInfo.getSystemVersion(),
                appVersion: await DeviceInfo.getVersion(),
                buildNumber: await DeviceInfo.getBuildNumber(),
                uniqueId: await DeviceInfo.getUniqueId()
            };
        }
        catch (error) {
            console.error('Failed to get device info:', error);
            this.deviceInfo = {
                brand: 'error',
                model: 'error',
                systemVersion: 'error',
                appVersion: 'error',
                buildNumber: 'error',
                uniqueId: `error-${Date.now()}`
            };
        }
    }
    setupCrashHandling() {
        // Set up global error handler if available
        if (typeof ErrorUtils !== 'undefined') {
            const originalHandler = ErrorUtils.getGlobalHandler();
            ErrorUtils.setGlobalHandler((error, isFatal) => {
                this.fatal('crash', 'App crashed', error, { isFatal });
                this.flush(); // Ensure logs are written before crash
                originalHandler?.(error, isFatal);
            });
        }
    }
    loadConfiguration() {
        // Load configuration from storage or use defaults
        // This can be expanded to read from AsyncStorage
        if (__DEV__) {
            this.currentLogLevel = LogLevel.DEBUG;
        }
        else {
            this.currentLogLevel = LogLevel.WARN;
        }
    }
    startFlushInterval() {
        // Flush logs every 30 seconds
        this.flushInterval = setInterval(() => {
            this.flush();
        }, 30000);
    }
    // Main logging methods
    verbose(category, message, data) {
        this.log(LogLevel.VERBOSE, category, message, data);
    }
    debug(category, message, data) {
        this.log(LogLevel.DEBUG, category, message, data);
    }
    info(category, message, data) {
        this.log(LogLevel.INFO, category, message, data);
    }
    warn(category, message, data) {
        this.log(LogLevel.WARN, category, message, data);
    }
    error(category, message, error, data) {
        this.log(LogLevel.ERROR, category, message, {
            ...data,
            error: error?.message,
            stack: error?.stack
        });
    }
    fatal(category, message, error, data) {
        this.log(LogLevel.FATAL, category, message, {
            ...data,
            error: error?.message,
            stack: error?.stack
        });
        // Immediately flush on fatal errors
        this.flush();
    }
    log(level, category, message, data) {
        if (level < this.currentLogLevel) {
            return;
        }
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            data: data ? this.sanitizeData(data) : undefined,
            sessionId: this.sessionId,
            appVersion: this.deviceInfo?.appVersion || 'unknown',
            platform: Platform.OS,
            deviceInfo: this.deviceInfo || undefined
        };
        // Add to buffer
        this.logBuffer.push(entry);
        // Console logging in development
        if (__DEV__) {
            const levelName = LogLevel[level];
            const prefix = `[${levelName}] [${category}]`;
            console.log(`${prefix} ${message}`, data || '');
        }
        // Check if buffer is full
        if (this.logBuffer.length >= this.maxBufferSize) {
            this.flush();
        }
    }
    sanitizeData(data) {
        // Use the comprehensive PrivacyFilter for sanitization
        return privacyFilter.sanitize(data);
    }
    async flush() {
        if (this.logBuffer.length === 0) {
            return;
        }
        const logsToWrite = [...this.logBuffer];
        this.logBuffer = [];
        try {
            await this.fileWriter.writeLogs(logsToWrite);
        }
        catch (error) {
            console.error('Failed to flush logs:', error);
            // Re-add logs to buffer if write failed
            this.logBuffer = [...logsToWrite, ...this.logBuffer];
        }
    }
    async exportLogs() {
        await this.flush(); // Ensure all logs are written
        return this.fileWriter.exportLogs();
    }
    async clearLogs() {
        this.logBuffer = [];
        await this.fileWriter.clearLogs();
    }
    setLogLevel(level) {
        this.currentLogLevel = level;
    }
    getLogLevel() {
        return this.currentLogLevel;
    }
    // Performance tracking helper
    startPerformanceTracking(operation) {
        const startTime = Date.now();
        return () => {
            const duration = Date.now() - startTime;
            this.debug('performance', `Operation completed: ${operation}`, {
                operation,
                duration,
                durationFormatted: `${duration}ms`
            });
        };
    }
}
// File Writer class to handle file operations
class FileWriter {
    constructor() {
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.maxLogFiles = 10;
        this.fileSystemAvailable = !!RNFS;
        if (this.fileSystemAvailable) {
            this.logDirectory = `${RNFS.DocumentDirectoryPath}/logs`;
            this.currentLogFile = '';
            this.initialize();
        }
        else {
            console.warn('File system not available, logging will be console-only');
            this.logDirectory = '';
            this.currentLogFile = '';
        }
    }
    async initialize() {
        await this.ensureLogDirectory();
        this.currentLogFile = await this.getCurrentLogFile();
    }
    async ensureLogDirectory() {
        try {
            const exists = await RNFS.exists(this.logDirectory);
            if (!exists) {
                await RNFS.mkdir(this.logDirectory);
            }
            // Create archive subdirectory
            const archiveDir = `${this.logDirectory}/archive`;
            const archiveExists = await RNFS.exists(archiveDir);
            if (!archiveExists) {
                await RNFS.mkdir(archiveDir);
            }
        }
        catch (error) {
            console.error('Failed to create log directory:', error);
        }
    }
    async getCurrentLogFile() {
        const logFileName = `${this.logDirectory}/current.log`;
        const exists = await RNFS.exists(logFileName);
        if (!exists) {
            await RNFS.writeFile(logFileName, '', 'utf8');
        }
        return logFileName;
    }
    async writeLogs(entries) {
        if (!this.fileSystemAvailable) {
            // Just log to console if file system not available
            entries.forEach(entry => {
                const levelName = LogLevel[entry.level];
                console.log(`[${levelName}] [${entry.category}] ${entry.message}`, entry.data || '');
            });
            return;
        }
        try {
            // Convert entries to JSON lines
            const logLines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
            // Check current file size
            const fileInfo = await RNFS.stat(this.currentLogFile).catch(() => null);
            if (fileInfo && fileInfo.size + logLines.length > this.maxFileSize) {
                await this.rotateLogFile();
            }
            // Append to current log file
            await RNFS.appendFile(this.currentLogFile, logLines, 'utf8');
        }
        catch (error) {
            console.error('Failed to write logs:', error);
            throw error;
        }
    }
    async rotateLogFile() {
        try {
            // Generate timestamp for archive name
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const archiveName = `${this.logDirectory}/archive/log-${timestamp}.log`;
            // Move current log to archive
            await RNFS.moveFile(this.currentLogFile, archiveName);
            // Create new current log file
            await RNFS.writeFile(this.currentLogFile, '', 'utf8');
            // Clean old logs
            await this.cleanOldLogs();
        }
        catch (error) {
            console.error('Failed to rotate log file:', error);
        }
    }
    async cleanOldLogs() {
        try {
            const archiveDir = `${this.logDirectory}/archive`;
            const files = await RNFS.readDir(archiveDir);
            // Sort files by modification time (oldest first)
            files.sort((a, b) => new Date(a.mtime).getTime() - new Date(b.mtime).getTime());
            // Remove oldest files if we exceed max count
            while (files.length > this.maxLogFiles) {
                const oldestFile = files.shift();
                if (oldestFile) {
                    await RNFS.unlink(oldestFile.path);
                }
            }
        }
        catch (error) {
            console.error('Failed to clean old logs:', error);
        }
    }
    async exportLogs() {
        if (!this.fileSystemAvailable) {
            console.warn('File system not available, cannot export logs');
            return '';
        }
        try {
            // For now, return the current log file path
            // In the future, this could zip all logs
            return this.currentLogFile;
        }
        catch (error) {
            console.error('Failed to export logs:', error);
            throw error;
        }
    }
    async clearLogs() {
        if (!this.fileSystemAvailable) {
            console.log('File system not available, logs cleared from memory only');
            return;
        }
        try {
            // Clear current log file
            await RNFS.writeFile(this.currentLogFile, '', 'utf8');
            // Clear archive directory
            const archiveDir = `${this.logDirectory}/archive`;
            const files = await RNFS.readDir(archiveDir);
            for (const file of files) {
                await RNFS.unlink(file.path);
            }
        }
        catch (error) {
            console.error('Failed to clear logs:', error);
        }
    }
}
// Export singleton instance for convenience
export const logger = DebugLogger.getInstance();
