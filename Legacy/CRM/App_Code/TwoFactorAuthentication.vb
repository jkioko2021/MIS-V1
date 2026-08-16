Imports System.IO
Imports System.Text
Imports System.Security.Cryptography
Imports Microsoft.Practices.EnterpriseLibrary.Security.Cryptography
Imports System.Data.Odbc
Imports System.Web
Imports System.Diagnostics
Imports Microsoft.VisualBasic
Namespace TwoFactor
    Public Class TwoFactorAuthentication
        Public Function GenRandomKeys() As String
            Dim KeyGen As RandomKeyGenerator
            Dim NumKeys As Integer

            Dim RandomKey As String

            NumKeys = 2

            KeyGen = New RandomKeyGenerator
            KeyGen.KeyLetters = "abcdefghijklmnopqrstuvwxyz"
            KeyGen.KeyNumbers = "0123456789"
            KeyGen.KeyChars = 4

            RandomKey = KeyGen.Generate()

            Return RandomKey

        End Function

        Public Function ResponseCode() As String
            Dim KeyGen As RandomKeyGenerator
            Dim NumKeys As Integer

            Dim RandomKey As String

            NumKeys = 4

            KeyGen = New RandomKeyGenerator
            KeyGen.KeyLetters = "0123456789"
            KeyGen.KeyNumbers = "0123456789"
            KeyGen.KeyChars = 4

            RandomKey = KeyGen.Generate()

            Return RandomKey

        End Function

        Public Function GenSerialKey() As String
            Dim KeyGen As RandomKeyGenerator
            Dim NumKeys As Integer

            Dim RandomKey As String

            NumKeys = 4

            KeyGen = New RandomKeyGenerator
            KeyGen.KeyLetters = "abcdefghijklmnopqrstuvwxyz"
            KeyGen.KeyNumbers = "0123456789"
            KeyGen.KeyChars = 8

            RandomKey = KeyGen.Generate()

            Return RandomKey

        End Function
    End Class
End Namespace