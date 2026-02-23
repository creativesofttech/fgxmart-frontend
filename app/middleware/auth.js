export default defineNuxtRouteMiddleware((to, from) => {
    const auth = useAuthStore()

    if (!auth.isLoggedIn) {
        return navigateTo('/login?redirect=' + to.fullPath)
    }
})
