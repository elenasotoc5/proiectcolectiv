package ubb.inothershoes;

import java.sql.Connection;
import java.sql.DriverManager;

public class App {
    public static void main(String[] args) {
        String dbUrl = System.getenv("DB_URL");
        String dbUser = System.getenv("DB_USER");
        String dbPass = System.getenv("DB_PASS");

        try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass)) {
            Thread.currentThread().join();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}