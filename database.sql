CREATE DATABASE IF NOT EXISTS birobs;
USE birobs;

-- Kullanıcılar Tablosu
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(20) PRIMARY KEY,
    password VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'student' veya 'advisor'
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100)
);

-- Dersler Tablosu
CREATE TABLE IF NOT EXISTS courses (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    instructor VARCHAR(100),
    credit INT,
    type VARCHAR(20) -- 'compulsory' veya 'elective'
);

-- Örnek Veriler: Kullanıcılar
-- Eğer veri varsa tekrar ekleme yapmamak için IGNORE kullanabiliriz veya truncate edebiliriz.
-- Basitlik için direkt INSERT (Duplicate hatası alabilir ama sorun değil)
INSERT IGNORE INTO users (id, password, role, name, department) VALUES 
('220408019', '123', 'student', 'Abdulkadir Yılmaz', 'Bilgisayar Mühendisliği'),
('admin', 'admin', 'advisor', 'Dr. Advisor', 'Bilgisayar Mühendisliği');

-- Örnek Veriler: Dersler
INSERT IGNORE INTO courses (code, name, instructor, credit, type) VALUES
('CENG301', 'Computer Networks', 'Dr. Ali', 6, 'compulsory'),
('CENG303', 'Software Engineering', 'Dr. Veli', 6, 'compulsory'),
('MATH201', 'Linear Algebra', 'Dr. Ayşe', 5, 'elective'),
('ENG102', 'Academic English', 'Inst. John', 3, 'elective'),
('HIST101', 'History of Republic', 'Dr. Fatma', 2, 'compulsory');
