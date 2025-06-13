USE master;
GO
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ClientesDB')
BEGIN
  CREATE DATABASE ClientesDB;
END
GO
USE ClientesDB;
GO
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Clientes' AND xtype='U')
CREATE TABLE Clientes (
  Nombre VARCHAR(100),
  Apellido VARCHAR(100),
  Email VARCHAR(100)
);
GO
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Logs' AND xtype='U')
CREATE TABLE Logs (
  id INT IDENTITY(1,1) PRIMARY KEY,
  timestamp VARCHAR(100),
  level VARCHAR(50),
  message VARCHAR(MAX),
  meta NVARCHAR(MAX)
);
GO
