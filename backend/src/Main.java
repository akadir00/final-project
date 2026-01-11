package com.birobs;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

public class Main {
    public static void main(String[] args) throws IOException {
        int port = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // API Endpoint
        server.createContext("/api/login", new LoginHandler());
        server.createContext("/api/change-password", new ChangePasswordHandler());

        // Static Files (Frontend)
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null);
        System.out.println("Sunucu baslatildi: http://localhost:" + port);
        server.start();
    }

    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            if ("POST".equals(t.getRequestMethod())) {
                java.util.Scanner scanner = new java.util.Scanner(t.getRequestBody()).useDelimiter("\\A");
                String body = scanner.hasNext() ? scanner.next() : "";

                String userId = parseJson(body, "userId");
                String password = parseJson(body, "password");
                String role = parseJson(body, "role");

                String response = "{\"status\":\"error\", \"message\":\"Hatalı kullanıcı adı veya şifre!\"}";
                int statusCode = 401;

                try (Connection conn = Database.getConnection()) {
                    if (conn != null) {
                        String query = "SELECT * FROM users WHERE id = ? AND password = ? AND role = ?";
                        PreparedStatement arg = conn.prepareStatement(query);
                        arg.setString(1, userId);
                        arg.setString(2, password);
                        arg.setString(3, role);
                        
                        ResultSet rs = arg.executeQuery();
                        if (rs.next()) {
                            response = "{\"status\":\"success\", \"role\":\"" + role + "\", \"name\":\"" + rs.getString("name") + "\"}";
                            statusCode = 200;
                        } else {
                            // Kullanıcı bulunamadı (401)
                            response = "{\"status\":\"error\", \"message\":\"Hatalı kullanıcı adı veya şifre!\"}";
                            statusCode = 401;
                        }
                    } else {
                        response = "{\"status\":\"error\", \"message\":\"Veritabanı bağlantısı yok\"}";
                        statusCode = 500;
                    }
                } catch (Exception e) {
                    System.err.println("Login Hatası: " + e.getMessage());
                    response = "{\"status\":\"error\", \"message\":\"Veritabanı hatası\"}";
                    statusCode = 500;
                }

                // Doğru UTF-8 byte uzunluğunu hesapla
                byte[] responseBytes = response.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                
                t.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                t.sendResponseHeaders(statusCode, responseBytes.length);
                OutputStream os = t.getResponseBody();
                os.write(responseBytes);
                os.close();
            }
        }
        
        private String parseJson(String json, String key) {
            String pattern = "\"" + key + "\":\"";
            int start = json.indexOf(pattern);
            if(start == -1) return "";
            start += pattern.length();
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        }
    }

    static class ChangePasswordHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            if ("POST".equals(t.getRequestMethod())) {
                java.util.Scanner scanner = new java.util.Scanner(t.getRequestBody()).useDelimiter("\\A");
                String body = scanner.hasNext() ? scanner.next() : "";

                // Basit JSON parser (Aynı metodları tekrar yazmamak için bu class içinde kopyalıyorum veya static yapabiliriz)
                // Hızlı çözüm: duplicate
                String userId = parseJson(body, "userId");
                String oldPassword = parseJson(body, "oldPassword");
                String newPassword = parseJson(body, "newPassword");

                String response = "{\"status\":\"error\", \"message\":\"İşlem başarısız\"}";
                int statusCode = 400;

                try (Connection conn = Database.getConnection()) {
                    if (conn != null) {
                        // 1. Eski şifreyi kontrol et
                        String checkQuery = "SELECT * FROM users WHERE id = ? AND password = ?";
                        PreparedStatement checkStmt = conn.prepareStatement(checkQuery);
                        checkStmt.setString(1, userId);
                        checkStmt.setString(2, oldPassword);
                        
                        ResultSet rs = checkStmt.executeQuery();
                        if(rs.next()) {
                            // 2. Yeni şifreyi güncelle
                            String updateQuery = "UPDATE users SET password = ? WHERE id = ?";
                            PreparedStatement updateStmt = conn.prepareStatement(updateQuery);
                            updateStmt.setString(1, newPassword);
                            updateStmt.setString(2, userId);
                            
                            int affected = updateStmt.executeUpdate();
                            if (affected > 0) {
                                response = "{\"status\":\"success\", \"message\":\"Şifre güncellendi\"}";
                                statusCode = 200;
                            }
                        } else {
                            response = "{\"status\":\"error\", \"message\":\"Mevcut şifre hatalı!\"}";
                            statusCode = 401;
                        }
                    }
                } catch (Exception e) {
                    System.err.println("Şifre Değiştirme Hatası: " + e.getMessage());
                    response = "{\"status\":\"error\", \"message\":\"Veritabanı hatası\"}";
                    statusCode = 500;
                }
                
                // Doğru UTF-8 byte uzunluğunu hesapla
                byte[] responseBytes = response.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                
                t.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                t.sendResponseHeaders(statusCode, responseBytes.length);
                OutputStream os = t.getResponseBody();
                os.write(responseBytes);
                os.close();
            }
        }
        
        private String parseJson(String json, String key) {
            String pattern = "\"" + key + "\":\"";
            int start = json.indexOf(pattern);
            if(start == -1) return "";
            start += pattern.length();
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        }
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String path = t.getRequestURI().getPath();
            if ("/".equals(path)) path = "/index.html";
            
            Path filePath = Paths.get("." + path);
            if (Files.exists(filePath) && !Files.isDirectory(filePath)) {
                String mimeType = "text/html";
                if (path.endsWith(".css")) mimeType = "text/css";
                else if (path.endsWith(".js")) mimeType = "application/javascript";
                
                t.getResponseHeaders().set("Content-Type", mimeType);
                t.sendResponseHeaders(200, Files.size(filePath));
                OutputStream os = t.getResponseBody();
                Files.copy(filePath, os);
                os.close();
            } else {
                String response = "404 Not Found";
                t.sendResponseHeaders(404, response.length());
                OutputStream os = t.getResponseBody();
                os.write(response.getBytes());
                os.close();
            }
        }
    }
}
