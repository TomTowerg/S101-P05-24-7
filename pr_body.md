## Changes
- Fix responsive layout in PackageVerificationModal, VerifyTOTPClient, SetupTOTPClient, QRScanner, UsersClient, ApartmentManager
- Add PageTransition component with fade-in for all page changes
- Add shake animation to VerifyOTPClient on wrong code
- Add staggered animations to package lists in both dashboards
- Remove unused imports across multiple components

## Testing
- Verified on 375px, 768px, 1440px
- Zero TypeScript errors
- bun dev runs clean

Closes #19
Closes #28
