package com.nbhv.thefinder.config;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.nbhv.thefinder.repo.UserRepo;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Component
public class BlacklistedUserFilter extends OncePerRequestFilter {

    private final UserRepo userRepo;

    public BlacklistedUserFilter(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        Long userId = session == null ? null : (Long) session.getAttribute("userId");

        if (userId != null && userRepo.findById(userId).map(user -> user.isBlacklisted()).orElse(false)) {
            session.invalidate();
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\":\"Tài khoản đã bị đưa vào blacklist\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/")
                || path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.equals("/api/auth/logout");
    }
}
