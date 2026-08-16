Imports System
Imports System.IO
Imports System.Text
Imports System.Security.Cryptography

Public Interface ICrypto
    Function BlockSize() As Integer
    Function KeySize() As Integer

    Function Encrypt(ByVal data As String) As String
    Function Decrypt(ByVal data As String) As String
End Interface

Public Class CryptoFactory
    Public Function MakeCryptographer() As ICrypto
        Return New EncryptDecrypt()
    End Function
End Class

Public Class EncryptDecrypt
    Implements ICrypto

    ' The key and initialization vector : change them for your application
    Private _key() As Byte = {132, 42, 53, 124, 75, 56, 87, 38, 9, 10, 161, 132, 183, _
91, 105, 16, 117, 218, 149, 230, 221, 212, 235, 64}
    Private _iv() As Byte = {83, 71, 26, 58, 54, 35, 22, 11, 83, 71, 26, 58, 54, 35, 22, 11}

    ' returns the default size, in bits of the iv
    Public Function BlockSize() As Integer Implements ICrypto.BlockSize
        Dim aes As New RijndaelManaged()

        Return aes.BlockSize
    End Function

    ' returns the default size, in bits of the key
    Public Function KeySize() As Integer Implements ICrypto.KeySize
        Dim aes As New RijndaelManaged()

        Return aes.KeySize
    End Function

    ' decrypts a string that was encrypted using the Encrypt method
    Public Function Decrypt(ByVal data As String) As String Implements ICrypto.Decrypt
        Try
            Dim inBytes() As Byte = Convert.FromBase64String(data)
            Dim mStream As New MemoryStream(inBytes, 0, inBytes.Length) ' instead of writing the decrypted text

            Dim aes As New RijndaelManaged()
            Dim cs As New CryptoStream(mStream, aes.CreateDecryptor(_key, _iv), CryptoStreamMode.Read)

            Dim sr As New StreamReader(cs)

            Return sr.ReadToEnd()
        Catch ex As Exception
            Throw ex
        End Try
    End Function

    ' Encrypts a given string
    Public Function Encrypt(ByVal data As String) As String Implements ICrypto.Encrypt
        Try
            Dim utf8 As New UTF8Encoding
            Dim inBytes() As Byte = utf8.GetBytes(data) ' ascii encoding uses 7 
            'bytes for characters whereas the encryption uses 8 bytes, thus we use utf8
            Dim ms As New MemoryStream() 'instead of writing the encrypted 
            'string to a filestream, I will use a memorystream

            Dim aes As New RijndaelManaged()
            Dim cs As New CryptoStream(ms, aes.CreateEncryptor(_key, _iv), CryptoStreamMode.Write)

            cs.Write(inBytes, 0, inBytes.Length) ' encrypt
            cs.FlushFinalBlock()

            Return Convert.ToBase64String(ms.GetBuffer(), 0, ms.Length)
        Catch ex As Exception
            Throw ex
        End Try
    End Function
End Class
