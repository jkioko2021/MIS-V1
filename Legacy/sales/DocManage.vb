Imports Microsoft.VisualBasic
Imports System.Data.SqlClient
Imports System.Web.Configuration
Imports System.IO
Imports System.Text
Imports System.Security.Cryptography
Imports Microsoft.Practices.EnterpriseLibrary.Security.Cryptography
Imports System.Data.Odbc
Imports System.Data.OracleClient
Imports System.Net.Mail
Imports Microsoft
Imports System.Diagnostics
Imports System.Net
Imports DocManage
Imports System.Data
Imports System.Globalization
Imports System.Threading
Imports System
Imports System.Runtime.Caching


Namespace DocManage
    Public Class Emailing
        Dim MyDBAction As New DataManagement
        Public Function SendNotification2(ByVal path As String, ByVal mysubj As String, ByVal strMsgBody As String, ByVal SendAsHTML As Boolean, _
        ByVal EmailServer As String, ByVal EmailUsername As String, ByVal EmailPassword As String, _
        Optional ByVal strSendtoEmail As String = "", Optional ByVal strSendToName As String = "", Optional ByVal strMailFromEmail As String = "", _
        Optional ByVal strMailFromName As String = "") As Boolean
            Dim oMsg = New MailMessage()
            Dim MessageSentOK As Boolean = False

            Try
                ''create the mail message

                'Dim mail As New MailMessage()

                ''set the addresses
                ''mail.From = New MailAddress("snjau@fintech.co.ke", "")
                ''mail.To.Add("you@yourcompany.com")

                'mail.From = New MailAddress(strMailFromEmail, strMailFromName)
                'mail.To.Add(strSendtoEmail)

                ''set the content
                'mail.Subject = strSubject
                'mail.Body = strMsgBody


                Dim MyMail As New QMailClient.EMail
                Dim mySMTPServer As New QMailClient.SMTPClient

                MyMail.To = strSendtoEmail
                MyMail.Subject = mysubj
                MyMail.From = strMailFromEmail
                If SendAsHTML = True Then
                    MyMail.Body = MyMail.BodyHTML(True)
                    'MyMail.Body = MyMail.BodyHTML(strMsgBody)
                End If
                MyMail.Body = strMsgBody


                mySMTPServer.RemoteServerAddress = WebConfigurationManager.AppSettings("EmailServer").ToString

                mySMTPServer.UserName = WebConfigurationManager.AppSettings("EmailUsername").ToString
                mySMTPServer.Password = WebConfigurationManager.AppSettings("EmailPassword").ToString
                mySMTPServer.Connect()
                If mySMTPServer.AuthLogin = True Then
                    MyMail.ReturnPath = ""
                    MyMail.ReplyTo = ""
                    MyMail.Priority = QMailClient.EMail.MailPriority.Normal
                    MyMail.InReplyTo = ""
                    MyMail.Header = ""
                    MyMail.Date = Now
                    MyMail.Cc = ""
                    MyMail.Bcc = ""
                    'mySMTPServer.Connect()
                    mySMTPServer.SendMail(MyMail)
                    MessageSentOK = True
                End If

                'Dim myMailClient As New System.Net.Mail.SmtpClient.AppSettings("SMTPHost")

                'myMailClient.DeliveryMethod = SmtpDeliveryMethod.PickupDirectoryFromIis

                'myMailClient.Send(strFromEmail, strTo, strSubject, strBody)


                '========================================================================================

                'oMsg.Body = strMsgBody.ToString
                'oMsg.IsBodyHtml = True
                'Dim oSmtp = New SmtpClient(WebConfigurationManager.AppSettings("EmailServer").ToString)


                ' ''You can choose several delivery methods. 
                ''oSmtp.DeliveryMethod = SmtpDeliveryMethod.SpecifiedPickupDirectory

                ''----------------------------------------------------------------------------------------
                'oSmtp.DeliveryMethod = SmtpDeliveryMethod.Network
                ''oSmtp.DeliveryMethod = SmtpDeliveryMethod.PickupDirectoryFromIis
                ''Some SMTP server will require that you first 
                ''authenticate against the server.

                'Dim oCredential = New Net.NetworkCredential(WebConfigurationManager.AppSettings("EmailUsername").ToString, WebConfigurationManager.AppSettings("EmailPassword").ToString)

                'oSmtp.UseDefaultCredentials = True
                'oSmtp.Credentials = oCredential
                ''---------------------------------------------------------------------

                ''Let's send it already
                'oSmtp.Send(oMsg)


                '=====================================================================================================

                ''if we are using the IIS SMTP Service, we can write the message
                ''directly to the PickupDirectory, and bypass the Network layer
                'Dim smtp As New SmtpClient()
                'smtp.DeliveryMethod = SmtpDeliveryMethod.PickupDirectoryFromIis
                'smtp.Send(mail)

                'MessageSentOK = True

            Catch ex As Exception
                MessageSentOK = False
            End Try

            Return MessageSentOK

        End Function

        Public Function SendNotification(ByVal path As String, ByVal mysubj As String, ByVal strMsgBody As String, ByVal SendAsHTML As Boolean, _
        ByVal EmailServer As String, ByVal EmailUsername As String, ByVal EmailPassword As String, _
        Optional ByVal strSendtoEmail As String = "", Optional ByVal strSendToName As String = "", Optional ByVal strMailFromEmail As String = "", _
        Optional ByVal strMailFromName As String = "", Optional ByVal cc_email As String = "") As Boolean

            Dim MessageSentOK As Boolean = False
            Dim oMsg = New MailMessage()
            Dim strHTML As String = ""

            Try



                ' Set the message sender
                oMsg.From = New MailAddress(strMailFromEmail, strMailFromName)
                ' The .To property is a generic collection, 
                ' so we can add as many recipients as we like.
                oMsg.To.Add(New MailAddress(strSendtoEmail, strSendToName))
                If cc_email <> "" Then
                    oMsg.CC.Add(New MailAddress(cc_email, strSendToName))
                End If

                ' Set the content
                oMsg.Subject = mysubj
                '-------------------------------------------------------------------------------------------------
                Dim MyMailBody As New StringBuilder
                ''oMsg.To.Add(New MailAddress(strSendtoEmail, strMailFromName.ToString))
                ' If address1.ToString <> "" Then oMsg.To.Add(New MailAddress(address1, customername.ToString))
                ' oMsg.Subject = strSubject
                ''strSubject = "Gulf African Bank Internet Banking Login Details"

                strHTML = "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>"
                strHTML = strHTML & "<html xmlns='http://www.w3.org/1999/xhtml' >"
                strHTML = strHTML & "<head>"
                strHTML = strHTML & "</head>"
                strHTML = strHTML & "<body>"
                strHTML = strHTML & "<table style='width: 468px'>"

                strHTML = strHTML & "<tr>"
                strHTML = strHTML & "<td colspan='3'>"


                strHTML = strHTML & "" & strMsgBody.ToString & "</span></em>"
                strHTML = strHTML & "<td>"
                strHTML = strHTML & "</td>"
                strHTML = strHTML & "</tr>"

                strHTML = strHTML & "<tr>"
                strHTML = strHTML & "<td>"
                strHTML = strHTML & "</td>"
                strHTML = strHTML & "<td>"
                strHTML = strHTML & "</td>"
                strHTML = strHTML & "<td>"
                strHTML = strHTML & "</td>"
                strHTML = strHTML & "</tr>"
                strHTML = strHTML & "</table>"
                strHTML = strHTML & "</body>"
                strHTML = strHTML & "</html>"
                oMsg.Body = strHTML.ToString
                oMsg.IsBodyHtml = True

                ''--------------------------------------------------------------------------------------
                Dim SmtpServer As New SmtpClient(EmailServer)
                Dim attachment_ As System.Net.Mail.Attachment
                If path <> "" Then
                    attachment_ = New System.Net.Mail.Attachment(path)
                    oMsg.Attachments.Add(attachment_)
                End If

                ServicePointManager.SecurityProtocol = CType(3072, SecurityProtocolType)

                'System.Net.ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls
                SmtpServer.UseDefaultCredentials = False
                SmtpServer.Credentials = New System.Net.NetworkCredential(EmailUsername, EmailPassword)
                SmtpServer.Port = 587
                'SmtpServer.Host = "smtp.office365.com"
                SmtpServer.EnableSsl = True
                SmtpServer.DeliveryMethod = SmtpDeliveryMethod.Network
                SmtpServer.TargetName = "STARTTLS/smtp.office365.com"
                SmtpServer.Send(oMsg)
                MessageSentOK = True

                'SmtpServer.DeliveryMethod = SmtpDeliveryMethod.Network
                'SmtpServer.Port = 2525
                'SmtpServer.UseDefaultCredentials = False
                'SmtpServer.Credentials = New System.Net.NetworkCredential(EmailUsername, EmailPassword)

                'SmtpServer.EnableSsl = True
                'SmtpServer.EnableSsl = False
                'SmtpServer.Send(oMsg)
                'MessageSentOK = True

                '-------------------------------------------------------------------------------------------

                '---------------------------------------------------------------------
            Catch ex As Exception
                'MyDBAction.DoLogs("Class==app_code.vb: Private Sub ShowReport()" & " : Error : " & ex.Message)
                ''Try
                ''    Dim oSmtp As New SmtpClient()
                ''    oSmtp.DeliveryMethod = SmtpDeliveryMethod.PickupDirectoryFromIis

                ''    oSmtp.Send(oMsg)
                ''    MessageSentOK = True

                ''    ''MessageSentOK = False

                ''Catch ex2 As Exception

                ''Try ''--If sending via iispickup directory fails, send thru' specified pickup directory

                ''    Dim oSmtp As New SmtpClient()

                ''    oSmtp.DeliveryMethod = SmtpDeliveryMethod.SpecifiedPickupDirectory
                ''    oSmtp.Send(oMsg)
                ''    MessageSentOK = True

                ''Catch ex3 As Exception

                ''    MessageSentOK = False

                ''End Try

                ''End Try

                MessageSentOK = False

            End Try

            Return MessageSentOK

        End Function

    End Class

    Public Class DocManagementSecurity
        Private Const hashProvider As String = "hashprovider"
        Private Const symmProvider As String = "symprovider"

        Private Const symmKeyFileName As String = "SymmetricKeyFile.txt"

        ' Encrypted string
        Private stringToEncrypt As String
        Private encryptedContentsBase64 As String

        ' Generated hash
        Private stringForHash As String
        Private generatedHash As Byte()
        Public Interface ICrypto
            Function BlockSize() As Integer
            Function KeySize() As Integer

            Function Encrypt(ByVal data As String) As String
            Function Decrypt(ByVal data As String) As String
        End Interface
        Public Class CryptoFactory
            Public Function MakeCryptographer(ByVal type As String) As ICrypto
                Dim mYIcrypto As ICrypto = New Rijndael()
                Select Case type.ToLower
                    Case "des"
                        'Return New DES()
                    Case "tripledes"
                        'Return New TripleDES()
                    Case "rijndael"
                        mYIcrypto = New Rijndael()
                    Case Else
                        mYIcrypto = New Rijndael()
                        'Return New TripleDES()
                End Select
                Return mYIcrypto
            End Function
        End Class
#Region "1. Create A Key "

        '*************************
        '** Create A Key
        '*************************

        Public Function CreateKey(ByVal strPassword As String) As Byte()
            'Convert strPassword to an array and store in chrData.
            Dim chrData() As Char = strPassword.ToCharArray
            'Use intLength to get strPassword size.
            Dim intLength As Integer = chrData.GetUpperBound(0)
            'Declare bytDataToHash and make it the same size as chrData.
            Dim bytDataToHash(intLength) As Byte

            'Use For Next to convert and store chrData into bytDataToHash.
            For i As Integer = 0 To chrData.GetUpperBound(0)
                bytDataToHash(i) = CByte(Asc(chrData(i)))
            Next

            'Declare what hash to use.
            Dim SHA512 As New System.Security.Cryptography.SHA512Managed
            'Declare bytResult, Hash bytDataToHash and store it in bytResult.
            Dim bytResult As Byte() = SHA512.ComputeHash(bytDataToHash)
            'Declare bytKey(31).  It will hold 256 bits.
            Dim bytKey(31) As Byte

            'Use For Next to put a specific size (256 bits) of 
            'bytResult into bytKey. The 0 To 31 will put the first 256 bits
            'of 512 bits into bytKey.
            For i As Integer = 0 To 31
                bytKey(i) = bytResult(i)
            Next

            Return bytKey 'Return the key.
        End Function

#End Region
#Region "2. Create An IV "

        '*************************
        '** Create An IV
        '*************************

        Public Function CreateIV(ByVal strPassword As String) As Byte()
            'Convert strPassword to an array and store in chrData.
            Dim chrData() As Char = strPassword.ToCharArray
            'Use intLength to get strPassword size.
            Dim intLength As Integer = chrData.GetUpperBound(0)
            'Declare bytDataToHash and make it the same size as chrData.
            Dim bytDataToHash(intLength) As Byte

            'Use For Next to convert and store chrData into bytDataToHash.
            For i As Integer = 0 To chrData.GetUpperBound(0)
                bytDataToHash(i) = CByte(Asc(chrData(i)))
            Next

            'Declare what hash to use.
            Dim SHA512 As New System.Security.Cryptography.SHA512Managed
            'Declare bytResult, Hash bytDataToHash and store it in bytResult.
            Dim bytResult As Byte() = SHA512.ComputeHash(bytDataToHash)
            'Declare bytIV(15).  It will hold 128 bits.
            Dim bytIV(15) As Byte

            'Use For Next to put a specific size (128 bits) of 
            'bytResult into bytIV. The 0 To 30 for bytKey used the first 256 bits.
            'of the hashed password. The 32 To 47 will put the next 128 bits into bytIV.
            For i As Integer = 32 To 47
                bytIV(i - 32) = bytResult(i)
            Next

            Return bytIV 'return the IV
        End Function

#End Region
#Region "3. Encrypt / Decrypt File "
        Dim strFileToEncrypt As String
        Dim strFileToDecrypt As String
        Dim strOutputEncrypt As String
        Dim strOutputDecrypt As String
        Dim fsInput As System.IO.FileStream
        Dim fsOutput As System.IO.FileStream

        Public Enum CryptoAction
            'Define the enumeration for CryptoAction.
            ActionEncrypt = 1
            ActionDecrypt = 2
        End Enum
        'Public Function EncryptOrDecryptFile(ByVal strInputFile As String, _
        '                                     ByVal strOutputFile As String, _
        '                                     ByVal bytKey() As Byte, _
        '                                     ByVal bytIV() As Byte, _
        '                                     ByVal Direction As CryptoAction) As String
        '    Try 'In case of errors.

        '        'Setup file streams to handle input and output. D:\PROJECTS\SOURCES
        '        fsInput = New System.IO.FileStream(strInputFile, FileMode.Open, _
        '                                           FileAccess.Read)
        '        fsOutput = New System.IO.FileStream(strOutputFile, FileMode.OpenOrCreate, _
        '                                            FileAccess.Write)
        '        fsOutput.SetLength(0) 'make sure fsOutput is empty

        '        'Declare variables for encrypt/decrypt process.
        '        Dim bytBuffer(4096) As Byte 'holds a block of bytes for processing
        '        Dim lngBytesProcessed As Long = 0 'running count of bytes processed
        '        Dim lngFileLength As Long = fsInput.Length 'the input file's length
        '        Dim intBytesInCurrentBlock As Integer 'current bytes being processed
        '        Dim csCryptoStream As CryptoStream
        '        'Declare your CryptoServiceProvider.
        '        Dim cspRijndael As New System.Security.Cryptography.RijndaelManaged

        '        Dim MStream As New MemoryStream()
        '        'Determine if ecryption or decryption and setup CryptoStream.
        '        Select Case Direction
        '            Case CryptoAction.ActionEncrypt
        '                csCryptoStream = New CryptoStream(fsOutput, _
        '                cspRijndael.CreateEncryptor(bytKey, bytIV), _
        '                CryptoStreamMode.Write)
        '            Case CryptoAction.ActionDecrypt
        '                csCryptoStream = New CryptoStream(MStream, _
        '                cspRijndael.CreateDecryptor(bytKey, bytIV), _
        '                CryptoStreamMode.Write)


        '        End Select
        '        'Use While to loop until all of the file is processed.
        '        While lngBytesProcessed < lngFileLength
        '            'Read file with the input filestream.
        '            intBytesInCurrentBlock = fsInput.Read(bytBuffer, 0, 4096)
        '            'Write output file with the cryptostream.
        '            csCryptoStream.Write(bytBuffer, 0, intBytesInCurrentBlock)
        '            'Update lngBytesProcessed
        '            lngBytesProcessed = lngBytesProcessed + CLng(intBytesInCurrentBlock)
        '        End While




        '        csCryptoStream.FlushFinalBlock()
        '        Dim cipherBytes As Byte() = MStream.ToArray()
        '        MStream.Close()

        '        'Close FileStreams and CryptoStream.
        '        csCryptoStream.Close()
        '        fsInput.Close()
        '        fsOutput.Close()

        '        fsOutput = Nothing
        '        fsInput = Nothing

        '        'If encrypting then delete the original unencrypted file.
        '        If Direction = CryptoAction.ActionEncrypt Then
        '            Dim fileOriginal As New FileInfo(strInputFile)
        '            fileOriginal.Delete()
        '            fileOriginal = Nothing
        '        End If


        '        'If decrypting then delete the encrypted file.
        '        If Direction = CryptoAction.ActionDecrypt Then
        '            Dim fileEncrypted As New FileInfo(strInputFile)
        '            fileEncrypted.Delete()
        '            fileEncrypted = Nothing
        '        End If

        '        'Update the user when the file is done.
        '        Dim Wrap As String = Chr(13) + Chr(10)
        '        If Direction = CryptoAction.ActionEncrypt Then
        '            EncryptOrDecryptFile = "Encryption Complete" + Wrap + Wrap + _
        '                 "Total bytes processed = " + _
        '                  lngBytesProcessed.ToString
        '        Else
        '            'Update the user when the file is done.
        '            EncryptOrDecryptFile = "Decryption Complete" + Wrap + Wrap + _
        '                   "Total bytes processed = " + _
        '                    lngBytesProcessed.ToString
        '        End If
        '        Return EncryptOrDecryptFile
        '        'Catch file not found error.
        '    Catch When Err.Number = 53 'if file not found
        '        EncryptOrDecryptFile = "Invalid Path or Filename,Please check to make sure the path and filename" + _
        '                "are correct and if the file exists."
        '        'Catch all other errors. And delete partial files.
        '    Catch
        '        fsInput.Close()
        '        fsOutput.Close()
        '        fsOutput = Nothing
        '        fsInput = Nothing

        '        If Direction = CryptoAction.ActionDecrypt Then
        '            Dim fileDelete As New FileInfo(strOutputFile)
        '            fileDelete.Delete()
        '            fileDelete = Nothing
        '            EncryptOrDecryptFile = "Invalid Password : Please check to make sure that you entered the correct" + _
        '                    "password."
        '        Else
        '            Dim fileDelete As New FileInfo(strOutputFile)
        '            fileDelete.Delete()

        '            fileDelete = Nothing

        '            EncryptOrDecryptFile = "Invalid File: This file cannot be encrypted."
        '        End If

        '    End Try
        'End Function
        Public Function EncryptOrDecryptFile(ByVal strInputFile As String, _
                                             ByVal strOutputFile As String, _
                                             ByVal bytKey() As Byte, _
                                             ByVal bytIV() As Byte, _
                                             ByVal Direction As CryptoAction) As String
            Try 'In case of errors.

                'Setup file streams to handle input and output. D:\PROJECTS\SOURCES
                fsInput = New System.IO.FileStream(strInputFile, FileMode.Open, _
                                                   FileAccess.Read)
                fsOutput = New System.IO.FileStream(strOutputFile, FileMode.OpenOrCreate, _
                                                    FileAccess.Write)
                fsOutput.SetLength(0) 'make sure fsOutput is empty

                'Declare variables for encrypt/decrypt process.
                Dim bytBuffer(4096) As Byte 'holds a block of bytes for processing
                Dim lngBytesProcessed As Long = 0 'running count of bytes processed
                Dim lngFileLength As Long = fsInput.Length 'the input file's length
                Dim intBytesInCurrentBlock As Integer 'current bytes being processed
                Dim csCryptoStream As CryptoStream = Nothing
                'Declare your CryptoServiceProvider.
                Dim cspRijndael As New System.Security.Cryptography.RijndaelManaged

                'Determine if ecryption or decryption and setup CryptoStream.
                Select Case Direction
                    Case CryptoAction.ActionEncrypt
                        csCryptoStream = New CryptoStream(fsOutput, _
                        cspRijndael.CreateEncryptor(bytKey, bytIV), _
                        CryptoStreamMode.Write)

                    Case CryptoAction.ActionDecrypt
                        csCryptoStream = New CryptoStream(fsOutput, _
                        cspRijndael.CreateDecryptor(bytKey, bytIV), _
                        CryptoStreamMode.Write)
                End Select

                'Use While to loop until all of the file is processed.
                While lngBytesProcessed < lngFileLength
                    'Read file with the input filestream.
                    intBytesInCurrentBlock = fsInput.Read(bytBuffer, 0, 4096)
                    'Write output file with the cryptostream.
                    csCryptoStream.Write(bytBuffer, 0, intBytesInCurrentBlock)
                    'Update lngBytesProcessed
                    lngBytesProcessed = lngBytesProcessed + CLng(intBytesInCurrentBlock)
                End While

                'Close FileStreams and CryptoStream.
                csCryptoStream.Close()
                fsInput.Close()
                fsOutput.Close()

                'If encrypting then delete the original unencrypted file.
                If Direction = CryptoAction.ActionEncrypt Then
                    Dim fileOriginal As New FileInfo(strInputFile)
                    fileOriginal.Delete()
                    fileOriginal = Nothing
                End If


                'If decrypting then delete the encrypted file.
                If Direction = CryptoAction.ActionDecrypt Then
                    Dim fileEncrypted As New FileInfo(strInputFile)
                    fileEncrypted.Delete()
                    fileEncrypted = Nothing
                End If

                'Update the user when the file is done.
                Dim Wrap As String = Chr(13) + Chr(10)
                If Direction = CryptoAction.ActionEncrypt Then
                    EncryptOrDecryptFile = "Encryption Complete" + Wrap + Wrap + _
                         "Total bytes processed = " + _
                          lngBytesProcessed.ToString
                Else
                    'Update the user when the file is done.
                    EncryptOrDecryptFile = "Decryption Complete" + Wrap + Wrap + _
                           "Total bytes processed = " + _
                            lngBytesProcessed.ToString
                End If

                fsOutput = Nothing
                fsInput = Nothing

                Return EncryptOrDecryptFile
                'Catch file not found error.
            Catch When Err.Number = 53 'if file not found
                EncryptOrDecryptFile = "Invalid Path or Filename,Please check to make sure the path and filename" + _
                        "are correct and if the file exists."
                'Catch all other errors. And delete partial files.
            Catch
                fsInput.Close()
                fsOutput.Close()
                fsOutput = Nothing
                fsInput = Nothing

                If Direction = CryptoAction.ActionDecrypt Then
                    Dim fileDelete As New FileInfo(strOutputFile)
                    fileDelete.Delete()
                    fileDelete = Nothing
                    EncryptOrDecryptFile = "Invalid Password : Please check to make sure that you entered the correct" + _
                            "password."
                Else
                    Dim fileDelete As New FileInfo(strOutputFile)
                    fileDelete.Delete()

                    fileDelete = Nothing

                    EncryptOrDecryptFile = "Invalid File: This file cannot be encrypted."
                End If

            End Try
        End Function

#End Region

        Public Function EncryptedPass(ByVal PassToEncrypt As String) As String
            Me.encryptedContentsBase64 = Cryptographer.EncryptSymmetric(symmProvider, PassToEncrypt)
            Return Me.encryptedContentsBase64
        End Function
        Public Function DencryptPass(ByVal PassToDecrypt As String) As String
            Try
                Dim readableString As String = Cryptographer.DecryptSymmetric(symmProvider, PassToDecrypt)
                Return readableString

            Catch ex As Exception
                'MsgBox(ex.Message, MsgBoxStyle.Critical, ex.Source)
                Return String.Empty
            End Try
        End Function
        Public Function GenRandomPassword() As String
            Dim KeyGen As RandomKeyGenerator
            Dim NumKeys As Integer
            'Dim i_Keys As Integer
            Dim RandomKey As String

            ' MODIFY THIS TO GET MORE KEYS    - LAITH - 27/07/2005 22:48:30 -
            NumKeys = 1

            KeyGen = New RandomKeyGenerator
            KeyGen.KeyLetters = "abcdefghjkmnpqrstuvwxyz"
            KeyGen.KeyNumbers = "123456789"

            'KeyGen.KeyLetters = "abcdefghijklmnopqrstuvwxyz"
            'KeyGen.KeyNumbers = "0123456789"
            KeyGen.KeyChars = 7

            RandomKey = KeyGen.Generate()

            Return RandomKey

            'For i_Keys = 1 To NumKeys
            '    RandomKey = KeyGen.Generate()
            '    Console.WriteLine(RandomKey)
            'Next
            'Console.WriteLine("Press any key to exit...")
            'Console.Read()
        End Function
        Public Class Rijndael
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


    End Class

    ''---This class is 4 encrypting/decrypting system settings - 11th April 2011
    Public Class SysSettsEncryption
        Public Function EncryptSHA(ByVal Data As String) As String
            Dim shaM As New System.Security.Cryptography.SHA1Managed
            Convert.ToBase64String(shaM.ComputeHash(Encoding.ASCII.GetBytes(Data)))
            Dim eNC_data() As Byte = ASCIIEncoding.UTF32.GetBytes(Data)
            Dim eNC_str As String = Convert.ToBase64String(eNC_data)
            EncryptSHA = eNC_str
        End Function

        Public Function DecryptSHA(ByVal Data As String) As String
            Try
                Dim dEC_data() As Byte = Convert.FromBase64String(Trim(Data))
                Dim dEC_Str As String = ASCIIEncoding.UTF32.GetString(dEC_data)
                DecryptSHA = dEC_Str
            Catch ex As Exception
                Return ex.Message
            End Try
        End Function

    End Class

    Public Class DataManagement

        Public MyAdapter As New SqlClient.SqlDataAdapter
        Public dt As New Data.DataTable
        Dim MyDatable As New Data.DataTable
        Dim cmd As New SqlCommand

        Public Const EMPTYSTR As String = ""
        Public Const EMPTYSTRNO As Double = 0.0
        Public Const EMPTYSTRN As Long = 0

#Region "1. Connect Management"
        Public Enum DBActionType
            DataReader = 1
            Dataset = 2
            Scalar = 3
            Delete = 4
            Insert = 5
            Update = 6
            DataTable = 7
            ODBCDataReader = 8
            ODBCScalar = 9
            ODBCDataTable = 10
            OracleDataReader = 11
            ' OracleScalar = 12
            'OracleDataTable = 13
            ODBCDataTable2 = 12
        End Enum
        Public Function DBAction(ByVal MyDBAction As Object, ByVal ActionType As DBActionType, Optional ByVal ConnectConfig As String = "", Optional ByVal CmdObject As SqlCommand = Nothing) As Object
            DBAction = Nothing
            Dim MyConnectstring As String = ""

            If ConnectConfig.Trim <> "" Then
                MyConnectstring = ConnectConfig
            Else
                MyConnectstring = "SALES"
            End If

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings(MyConnectstring).ConnectionString)
            'Dim DecryptedStr As String = Cryptographer.Encrypt(WebConfigurationManager.ConnectionStrings(MyConnectstring).ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)

            myConnection.Open()

            Select Case ActionType
                Case 1
                    Dim myCommand As New SqlCommand(MyDBAction.ToString, myConnection)
                    Return myCommand.ExecuteReader(Data.CommandBehavior.CloseConnection)

                Case 2
                    Dim MyAdpater As New SqlDataAdapter(MyDBAction.ToString, myConnection)
                    Dim myDataSet As New Data.DataSet
                    MyAdpater.Fill(myDataSet)

                    myConnection.Close()

                    Return myDataSet
                Case 3
                    Dim myCommand As New SqlCommand(MyDBAction.ToString, myConnection)
                    Dim ScalarItem As Object = myCommand.ExecuteScalar

                    myConnection.Close()

                    Return ScalarItem

                Case 4, 5, 6
                    Dim myCommand As New SqlCommand(MyDBAction.ToString, myConnection)
                    myCommand.ExecuteNonQuery()
                    myConnection.Close()

                Case 7
                    Dim MyAdpater As New SqlDataAdapter(MyDBAction.ToString, myConnection)
                    Dim MyDataTable As New Data.DataTable
                    MyAdpater.Fill(MyDataTable)
                    myConnection.Close()

                    Return MyDataTable

                Case 8
                    myConnection.Close()

                    Dim myODBCConnection As New OdbcConnection(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)
                    myODBCConnection.Open()


                    Dim myCommand As New OdbcCommand(MyDBAction.ToString, myODBCConnection)
                    Dim MyReader As OdbcDataReader = myCommand.ExecuteReader(Data.CommandBehavior.CloseConnection)

                    Return MyReader
                Case 9
                    myConnection.Close()

                    Dim myODBCConnection As New OdbcConnection(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)
                    myODBCConnection.Open()

                    Dim myCommand As New OdbcCommand(MyDBAction.ToString, myODBCConnection)
                    Dim ScalarItem As Object = myCommand.ExecuteScalar

                    myODBCConnection.Close()

                    Return ScalarItem

                Case 10
                    myConnection.Close()

                    DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

                    Dim myODBCConnection As New OdbcConnection(DecryptedStr)
                    myODBCConnection.Open()

                    Dim MyAdpater As New OdbcDataAdapter(MyDBAction.ToString, myODBCConnection)
                    Dim MyDataTable As New Data.DataTable
                    MyAdpater.Fill(MyDataTable)
                    myODBCConnection.Close()

                    Return MyDataTable

                Case 11

                    DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

                    Dim Conn As New SqlConnection(DecryptedStr)
                    Conn.Open()

                    Dim cmd As New SqlCommand
                    Dim Result As String
                    With cmd
                        .Connection = Conn
                        .CommandText = MyDBAction
                        Result = .ExecuteScalar
                    End With
                    Conn.Close()

                    Return Result
                Case 12

                    CmdObject.Connection = myConnection
                    MyAdapter = New SqlClient.SqlDataAdapter(CmdObject)
                    MyAdapter.Fill(dt)
                    myConnection.Close()
                    Return dt
            End Select
        End Function

        Public Function eoxegen(ByVal MyDBAction As Object, ByVal ActionType As DBActionType, Optional ByVal ConnectConfig As String = "", Optional ByVal CmdObject As SqlCommand = Nothing) As Object
            eoxegen = Nothing
            Dim MyConnectstring As String = ""

            If ConnectConfig.Trim <> "" Then
                MyConnectstring = ConnectConfig
            Else
                MyConnectstring = "eoxegen"
            End If

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings(MyConnectstring).ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)

            myConnection.Open()

            Select Case ActionType
                Case 1
                    Dim myCommand As New SqlCommand(MyDBAction.ToString, myConnection)
                    Return myCommand.ExecuteReader(Data.CommandBehavior.CloseConnection)

                Case 2
                    Dim MyAdpater As New SqlDataAdapter(MyDBAction.ToString, myConnection)
                    Dim myDataSet As New Data.DataSet
                    MyAdpater.Fill(myDataSet)

                    myConnection.Close()

                    Return myDataSet
                Case 3
                    Dim myCommand As New SqlCommand(MyDBAction.ToString, myConnection)
                    Dim ScalarItem As Object = myCommand.ExecuteScalar

                    myConnection.Close()

                    Return ScalarItem

                Case 4, 5, 6
                    Dim myCommand As New SqlCommand(MyDBAction.ToString, myConnection)
                    myCommand.ExecuteNonQuery()
                    myConnection.Close()

                Case 7
                    Dim MyAdpater As New SqlDataAdapter(MyDBAction.ToString, myConnection)
                    Dim MyDataTable As New Data.DataTable
                    MyAdpater.Fill(MyDataTable)
                    myConnection.Close()

                    Return MyDataTable

                Case 8
                    myConnection.Close()

                    Dim myODBCConnection As New OdbcConnection(WebConfigurationManager.ConnectionStrings("DocMaCHQ").ConnectionString)
                    myODBCConnection.Open()


                    Dim myCommand As New OdbcCommand(MyDBAction.ToString, myODBCConnection)
                    Dim MyReader As OdbcDataReader = myCommand.ExecuteReader(Data.CommandBehavior.CloseConnection)

                    Return MyReader
                Case 9
                    myConnection.Close()

                    Dim myODBCConnection As New OdbcConnection(WebConfigurationManager.ConnectionStrings("DocMaCHQ").ConnectionString)
                    myODBCConnection.Open()

                    Dim myCommand As New OdbcCommand(MyDBAction.ToString, myODBCConnection)
                    Dim ScalarItem As Object = myCommand.ExecuteScalar

                    myODBCConnection.Close()

                    Return ScalarItem

                Case 10
                    myConnection.Close()

                    DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("DocMaCHQ").ConnectionString)

                    Dim myODBCConnection As New OdbcConnection(DecryptedStr)
                    myODBCConnection.Open()

                    Dim MyAdpater As New OdbcDataAdapter(MyDBAction.ToString, myODBCConnection)
                    Dim MyDataTable As New Data.DataTable
                    MyAdpater.Fill(MyDataTable)
                    myODBCConnection.Close()

                    Return MyDataTable

                Case 11

                    DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("DocMaCHQ").ConnectionString)

                    Dim Conn As New SqlConnection(DecryptedStr)
                    Conn.Open()

                    Dim cmd As New SqlCommand
                    Dim Result As String
                    With cmd
                        .Connection = Conn
                        .CommandText = MyDBAction
                        Result = .ExecuteScalar
                    End With
                    Conn.Close()

                    Return Result
                Case 12

                    CmdObject.Connection = myConnection
                    MyAdapter = New SqlClient.SqlDataAdapter(CmdObject)
                    MyAdapter.Fill(dt)
                    myConnection.Close()
                    Return dt
            End Select
        End Function

        Public Function eoxegen_live(ByVal MyDBAction As Object, ByVal ActionType As DBActionType, Optional ByVal ConnectConfig As String = "", Optional ByVal CmdObject As SqlCommand = Nothing) As Object
            eoxegen_live = Nothing
            Dim MyConnectstring As String = ""

            If ConnectConfig.Trim <> "" Then
                MyConnectstring = ConnectConfig
            Else
                MyConnectstring = "eoxegen_LIVE"
            End If

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings(MyConnectstring).ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)

            myConnection.Open()

            Select Case ActionType
                Case 1
                    Dim myCommand As New SqlCommand(MyDBAction.ToString, myConnection)
                    Return myCommand.ExecuteReader(Data.CommandBehavior.CloseConnection)

                Case 2
                    Dim MyAdpater As New SqlDataAdapter(MyDBAction.ToString, myConnection)
                    Dim myDataSet As New Data.DataSet
                    MyAdpater.Fill(myDataSet)

                    myConnection.Close()

                    Return myDataSet
                Case 3
                    Dim myCommand As New SqlCommand(MyDBAction.ToString, myConnection)
                    Dim ScalarItem As Object = myCommand.ExecuteScalar

                    myConnection.Close()

                    Return ScalarItem

                Case 4, 5, 6
                    Dim myCommand As New SqlCommand(MyDBAction.ToString, myConnection)
                    myCommand.ExecuteNonQuery()
                    myConnection.Close()

                Case 7
                    Dim MyAdpater As New SqlDataAdapter(MyDBAction.ToString, myConnection)
                    Dim MyDataTable As New Data.DataTable
                    MyAdpater.Fill(MyDataTable)
                    myConnection.Close()

                    Return MyDataTable

                Case 8
                    myConnection.Close()

                    Dim myODBCConnection As New OdbcConnection(WebConfigurationManager.ConnectionStrings("DocMaCHQ").ConnectionString)
                    myODBCConnection.Open()


                    Dim myCommand As New OdbcCommand(MyDBAction.ToString, myODBCConnection)
                    Dim MyReader As OdbcDataReader = myCommand.ExecuteReader(Data.CommandBehavior.CloseConnection)

                    Return MyReader
                Case 9
                    myConnection.Close()

                    Dim myODBCConnection As New OdbcConnection(WebConfigurationManager.ConnectionStrings("DocMaCHQ").ConnectionString)
                    myODBCConnection.Open()

                    Dim myCommand As New OdbcCommand(MyDBAction.ToString, myODBCConnection)
                    Dim ScalarItem As Object = myCommand.ExecuteScalar

                    myODBCConnection.Close()

                    Return ScalarItem

                Case 10
                    myConnection.Close()

                    DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("DocMaCHQ").ConnectionString)

                    Dim myODBCConnection As New OdbcConnection(DecryptedStr)
                    myODBCConnection.Open()

                    Dim MyAdpater As New OdbcDataAdapter(MyDBAction.ToString, myODBCConnection)
                    Dim MyDataTable As New Data.DataTable
                    MyAdpater.Fill(MyDataTable)
                    myODBCConnection.Close()

                    Return MyDataTable

                Case 11

                    DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("DocMaCHQ").ConnectionString)

                    Dim Conn As New SqlConnection(DecryptedStr)
                    Conn.Open()

                    Dim cmd As New SqlCommand
                    Dim Result As String
                    With cmd
                        .Connection = Conn
                        .CommandText = MyDBAction
                        Result = .ExecuteScalar
                    End With
                    Conn.Close()

                    Return Result
                Case 12

                    CmdObject.Connection = myConnection
                    MyAdapter = New SqlClient.SqlDataAdapter(CmdObject)
                    MyAdapter.Fill(dt)
                    myConnection.Close()
                    Return dt
            End Select
        End Function

        Public Function UpdateDB(ByVal sql As String) As Boolean

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            Dim cmd As New SqlCommand

            'Try

            myConnection.Open()
            'cmd = Nothing

            cmd.CommandType = Data.CommandType.Text

            cmd.Connection = myConnection

            cmd.CommandText = sql

            cmd.ExecuteNonQuery()

            Return True
            myConnection.Close()
            'Catch ex As Exception

            '    Return False
            'Finally

            'End Try
        End Function
#End Region
#Region "2. Execute Sps"
#Region "From James"

#End Region
        Public Function GetDataTable(ByVal Str As String) As DataTable
            Try
                Dim MyDatable As New Data.DataTable
                Dim MyQuery As String = ""
                MyQuery = Str
                GetDataTable = TryCast(DBAction(MyQuery, DataManagement.DBActionType.DataTable), Data.DataTable)
            Catch ex As Exception
                GetDataTable = Nothing
            End Try
        End Function
        Public Function LoadReport(
            ByVal sp_Name As String,
            ByVal MemberNo As String,
            ByVal MemberNo_Family As String,
            ByVal QuotationNo As String,
            ByVal InvoiceNo As String,
            ByVal EntryDate_From As String,
            ByVal EntryDate_To As String,
            ByVal PolicyDate_From As String,
            ByVal PolicyDate_To As String,
            ByVal ReceiptNo As String,
            ByVal PolicyCode As String,
            ByVal Proposer As String,
            ByVal CorporateName As String,
            ByVal ClaimNo As String,
            ByVal Agency As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand(sp_Name, myConnection)

            'Try
            With myCommand


                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@MemberNo", Data.SqlDbType.VarChar, 50).Value = MemberNo
                .Parameters.Add("@MemberNo_Family", Data.SqlDbType.VarChar, 50).Value = MemberNo_Family
                .Parameters.Add("@QuotationNo", Data.SqlDbType.VarChar, 150).Value = QuotationNo
                .Parameters.Add("@InvoiceNo", Data.SqlDbType.VarChar, 100).Value = InvoiceNo
                .Parameters.Add("@EntryDate_From", Data.SqlDbType.VarChar, 50).Value = EntryDate_From
                .Parameters.Add("@EntryDate_To", Data.SqlDbType.VarChar, 50).Value = EntryDate_To
                .Parameters.Add("@PolicyDate_From", Data.SqlDbType.VarChar, 100).Value = PolicyDate_From
                .Parameters.Add("@PolicyDate_To", Data.SqlDbType.VarChar, 50).Value = PolicyDate_From
                .Parameters.Add("@ReceiptNo", Data.SqlDbType.VarChar, 50).Value = ReceiptNo
                .Parameters.Add("@PolicyCode", Data.SqlDbType.VarChar, 150).Value = PolicyCode
                .Parameters.Add("@Proposer", Data.SqlDbType.VarChar, 100).Value = Proposer
                .Parameters.Add("@CorporateName", Data.SqlDbType.VarChar, 50).Value = CorporateName
                .Parameters.Add("@ClaimNo", Data.SqlDbType.VarChar, 50).Value = ClaimNo
                .Parameters.Add("@Agency", Data.SqlDbType.VarChar, 50).Value = Agency
                .ExecuteNonQuery()
                myID = .Parameters.Item("@ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function AddProfile(ByVal strProfileName As String, ByVal strProfileType As String, ByVal strRemarks As String) As Int32
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("Add_Profile", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@PROFILENAME", Data.SqlDbType.VarChar, 100).Value = strProfileName
                .Parameters.Add("@PROFILETYPE", Data.SqlDbType.VarChar, 200).Value = strProfileType
                .Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()
                MyProfileID = .Parameters.Item("@ProfileID").Value.ToString
            End With

            myConnection.Close()
            Return CInt(MyProfileID)

        End Function
        Public Function Addapproval(ByVal ID As Integer, ByVal approve As String, ByVal COMMENT As String, ByVal Approved_by As String) As Int32
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("Addapproval", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ID", Data.SqlDbType.Int, 4).Direction = Data.ParameterDirection.Output
                '.Parameters.Add("@AGENT_ID", Data.SqlDbType.VarChar, 100).Value = AGENT_ID
                .Parameters.Add("@ID", Data.SqlDbType.Int).Value = ID
                .Parameters.Add("@approve", Data.SqlDbType.VarChar, 200).Value = approve
                .Parameters.Add("@COMMENT", Data.SqlDbType.VarChar, 200).Value = COMMENT
                .Parameters.Add("@Approved_by", Data.SqlDbType.VarChar, 200).Value = Approved_by
                .ExecuteNonQuery()
                'MyProfileID = .Parameters.Item("@ID").Value
            End With

            myConnection.Close()
            'Return MyProfileID

        End Function
        Public Function REGISTER_BUSINESS(ByVal File_No As String, ByVal Business_Type As String, ByVal Proposer_Name As String, ByVal Type As String, _
        ByVal Receive_Date As String, ByVal Receive_From As String, ByVal Agent As String, ByVal Benefit As String, ByVal Population As Decimal, ByVal Premium As Decimal, _
        ByVal Comment As String, ByVal STS As Integer) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_REGISTER_BUSINESS", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output


                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 150).Value = File_No
                .Parameters.Add("@Business_Type", Data.SqlDbType.VarChar, 150).Value = Business_Type
                .Parameters.Add("@Proposer_Name", Data.SqlDbType.VarChar, 150).Value = Proposer_Name
                .Parameters.Add("@Type", Data.SqlDbType.VarChar, 150).Value = Type
                '.Parameters.Add("@BRANCH_CODE", Data.SqlDbType.VarChar, 50).Value = BRANCH_CODE
                .Parameters.Add("@Receive_Date", Data.SqlDbType.NVarChar, 50).Value = Receive_Date
                .Parameters.Add("@Receive_From", Data.SqlDbType.VarChar, 50).Value = Receive_From
                .Parameters.Add("@Agent", Data.SqlDbType.VarChar, 150).Value = Agent
                .Parameters.Add("@Benefit", Data.SqlDbType.VarChar, 150).Value = Benefit
                .Parameters.Add("@Population", Data.SqlDbType.Decimal).Value = Population
                .Parameters.Add("@Premium", Data.SqlDbType.Decimal).Value = Premium
                .Parameters.Add("@sts", Data.SqlDbType.Int).Value = STS
                .Parameters.Add("@Comment", Data.SqlDbType.NVarChar, 250).Value = Comment
                '.Parameters.Add("@BRANCH_CODE", Data.SqlDbType.VarChar, 50).Value = BRANCH_CODE



                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACK_OTHER_PARTIES(ByVal TENDER_NO As String, ByVal OTH_AGENT_ID As String, ByVal OTH_BRANCH As String, _
                                             ByVal OTH_ENTERED_BY As String, ByVal COMMENTS As String, ByVal sts As Integer) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_REGISTER_OTHERPARTIED", myConnection)

            With myCommand

                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@TENDER_NO", Data.SqlDbType.VarChar, 150).Value = TENDER_NO
                '.Parameters.Add("@CORPORATE_NAME", Data.SqlDbType.VarChar, 150).Value = CORPORATE_NAME
                .Parameters.Add("@OTH_AGENT_ID", Data.SqlDbType.VarChar, 150).Value = OTH_AGENT_ID
                .Parameters.Add("@OTH_BRANCH", Data.SqlDbType.VarChar, 50).Value = OTH_BRANCH
                .Parameters.Add("@OTH_ENTERED_BY", Data.SqlDbType.VarChar, 50).Value = OTH_ENTERED_BY
                .Parameters.Add("@COMMENTS", Data.SqlDbType.VarChar, 200).Value = COMMENTS
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = sts

                .ExecuteNonQuery()
                'myID = .Parameters.Item("@ID").Value
            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function ADD_LEAD_CLASS(ByVal LEAD_CODE As String, ByVal LEAD_CLASS As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_LEAD_CLASS_ADD", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@LEAD_CODE", Data.SqlDbType.VarChar, 50).Value = LEAD_CODE
                .Parameters.Add("@LEAD_CLASS", Data.SqlDbType.VarChar, 50).Value = LEAD_CLASS
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function LEAD_MESSAGES(ByVal LEAD_CODE As String, ByVal CHAT_FROM As String, ByVal CHAT_TO As String, ByVal MESSAGE As String, ByVal FOLLOWUP_DATE As String, ByVal ENTERED_BY As String, ByVal ACTIVITY As String, ByVal MGR As String, ByVal HIER_TYPE As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_LEAD_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@LEAD_CODE", Data.SqlDbType.VarChar, 50).Value = LEAD_CODE
                .Parameters.Add("@CHAT_FROM", Data.SqlDbType.VarChar, 50).Value = CHAT_FROM
                .Parameters.Add("@CHAT_TO", Data.SqlDbType.VarChar, 50).Value = CHAT_TO
                .Parameters.Add("@MESSAGE", Data.SqlDbType.VarChar, 300).Value = MESSAGE
                .Parameters.Add("@FOLLOWUP_DATE", Data.SqlDbType.VarChar, 50).Value = FOLLOWUP_DATE
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 50).Value = ENTERED_BY
                .Parameters.Add("@ACTIVITY", Data.SqlDbType.VarChar, 50).Value = ACTIVITY
                .Parameters.Add("@MGR", Data.SqlDbType.VarChar, 50).Value = MGR
                .Parameters.Add("@HIER_TYPE", Data.SqlDbType.VarChar, 50).Value = HIER_TYPE
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function LEAD_TRACKING(ByVal LEAD_CODE As String, ByVal LEAD_DATE As String, ByVal CLOSE_DT As String, ByVal BUSINESS_NAME As String, ByVal COVER_TYPE As String, ByVal BENEFIT_TYPE As String, ByVal CURRENT_INSURER As String, ByVal CONTACT_NAME As String, ByVal PROGRESS As String, _
                                      ByVal STATUS As String, ByVal PERC_STATUS As String, ByVal AGENT_ID As String, _
                                      ByVal COUNTY As Integer, ByVal EMAIL As String, ByVal PHONE_NUMBER As String, ByVal FORECAST_AMT As Decimal, ByVal CLIENT_TYPE As String, ByVal FOLLOW_UP_DATE As String, ByVal NOTES As String,
                                      ByVal Entered_by As String, ByVal Lead_Owner As String, ByVal STS As Integer, ByVal IS_TENDER As Integer) As Integer

            Dim myID As Double = 0
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_SALES_LEAD_TRACKING", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@LEAD_CODE", Data.SqlDbType.VarChar, 50).Value = LEAD_CODE
                .Parameters.Add("@LEAD_DATE", Data.SqlDbType.VarChar, 50).Value = LEAD_DATE
                .Parameters.Add("@CLOSE_DT", Data.SqlDbType.VarChar, 50).Value = CLOSE_DT
                .Parameters.Add("@BUSINESS_NAME", Data.SqlDbType.VarChar, 150).Value = BUSINESS_NAME
                .Parameters.Add("@COVER_TYPE", Data.SqlDbType.VarChar, 50).Value = COVER_TYPE
                .Parameters.Add("@BENEFIT_TYPE", Data.SqlDbType.VarChar, 50).Value = BENEFIT_TYPE
                .Parameters.Add("@CURRENT_INSURER", Data.SqlDbType.VarChar, 150).Value = CURRENT_INSURER
                .Parameters.Add("@CONTACT_NAME", Data.SqlDbType.VarChar, 150).Value = CONTACT_NAME
                .Parameters.Add("@PROGRESS", Data.SqlDbType.VarChar, 50).Value = PROGRESS
                .Parameters.Add("@STATUS", Data.SqlDbType.VarChar, 50).Value = STATUS
                .Parameters.Add("@PERC_STATUS", Data.SqlDbType.VarChar, 50).Value = PERC_STATUS
                .Parameters.Add("@AGENT_ID", Data.SqlDbType.VarChar, 50).Value = AGENT_ID
                .Parameters.Add("@COUNTY", Data.SqlDbType.Int).Value = COUNTY
                .Parameters.Add("@EMAIL", Data.SqlDbType.VarChar, 50).Value = EMAIL
                .Parameters.Add("@PHONE_NUMBER", Data.SqlDbType.VarChar, 50).Value = PHONE_NUMBER
                .Parameters.Add("@FORECAST_AMT", Data.SqlDbType.Decimal).Value = FORECAST_AMT
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 50).Value = Entered_by
                .Parameters.Add("@CLIENT_TYPE", Data.SqlDbType.VarChar, 50).Value = CLIENT_TYPE
                .Parameters.Add("@FOLLOW_UP_DATE", Data.SqlDbType.VarChar, 50).Value = FOLLOW_UP_DATE
                .Parameters.Add("@NOTES", Data.SqlDbType.VarChar, 250).Value = NOTES
                .Parameters.Add("@Lead_Owner", Data.SqlDbType.VarChar, 50).Value = Lead_Owner
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .Parameters.Add("@IS_TENDER", Data.SqlDbType.Int).Value = IS_TENDER
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function LEAD_MONITORING(ByVal LEAD_CODE As String, ByVal CLOSE_DT As String, ByVal CONTACT_NAME As String, ByVal PROGRESS As String, _
                                      ByVal STATUS As String, ByVal PERC_STATUS As String, _
                                      ByVal EMAIL As String, ByVal PHONE_NUMBER As String, ByVal FORECAST_AMT As Decimal, ByVal FOLLOW_UP_DATE As String, ByVal NOTES As String,
                                      ByVal Entered_by As String, ByVal COVER_TYPE As String, ByVal CLIENT_TYPE As String, ByVal CATEGORY As String, ByVal LOSS_TYPE As String, ByVal LOSS_TO As String, ByVal FOLLOWUP_ACTIVITY As String, ByVal AGENDA As String) As Integer

            Dim myID As Double = 0
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_SALES_LEAD_MONITORING", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@LEAD_CODE", Data.SqlDbType.VarChar, 50).Value = LEAD_CODE
                .Parameters.Add("@CLOSE_DT", Data.SqlDbType.VarChar, 50).Value = CLOSE_DT
                .Parameters.Add("@CONTACT_NAME", Data.SqlDbType.VarChar, 150).Value = CONTACT_NAME
                .Parameters.Add("@PROGRESS", Data.SqlDbType.VarChar, 50).Value = PROGRESS
                .Parameters.Add("@STATUS", Data.SqlDbType.VarChar, 50).Value = STATUS
                .Parameters.Add("@PERC_STATUS", Data.SqlDbType.VarChar, 50).Value = PERC_STATUS
                .Parameters.Add("@EMAIL", Data.SqlDbType.VarChar, 50).Value = EMAIL
                .Parameters.Add("@PHONE_NUMBER", Data.SqlDbType.VarChar, 50).Value = PHONE_NUMBER
                .Parameters.Add("@FORECAST_AMT", Data.SqlDbType.Decimal).Value = FORECAST_AMT
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 50).Value = Entered_by
                .Parameters.Add("@FOLLOW_UP_DATE", Data.SqlDbType.VarChar, 50).Value = FOLLOW_UP_DATE
                .Parameters.Add("@NOTES", Data.SqlDbType.VarChar, 250).Value = NOTES
                'ByVal COVER_TYPE As String, ByVal CLIENT_TYPE As String, ByVal CATEGORY As String, ByVal LOSS_TYPE As String, ByVal LOSS_TO As String, ByVal FOLLOWUP_ACTIVITY As String, ByVal AGENDA As String) As Integer
                .Parameters.Add("@COVER_TYPE", Data.SqlDbType.VarChar, 50).Value = COVER_TYPE
                .Parameters.Add("@CLIENT_TYPE", Data.SqlDbType.VarChar, 50).Value = CLIENT_TYPE
                .Parameters.Add("@CATEGORY", Data.SqlDbType.VarChar, 50).Value = CATEGORY
                .Parameters.Add("@LOSS_TYPE", Data.SqlDbType.VarChar, 50).Value = LOSS_TYPE
                .Parameters.Add("@LOSS_TO", Data.SqlDbType.VarChar, 50).Value = LOSS_TO
                .Parameters.Add("@FOLLOWUP_ACTIVITY", Data.SqlDbType.VarChar, 50).Value = FOLLOWUP_ACTIVITY
                .Parameters.Add("@AGENDA", Data.SqlDbType.VarChar, 250).Value = AGENDA
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TENDER_QUOTE_ACK(ByVal ACK As Integer, ByVal TENDER_NO As String, ByVal DATE_ACK As DateTime, ByVal COMMENTS As String, ByVal ACK_BY As String, ByVal QUOTE_ALLOCATE_TO As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_ACK_QUOTE", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@TENDER_NO", Data.SqlDbType.VarChar, 150).Value = TENDER_NO
                .Parameters.Add("@ACK", Data.SqlDbType.Int, 150).Value = ACK
                .Parameters.Add("@DATE_ACK", Data.SqlDbType.DateTime).Value = DATE_ACK
                .Parameters.Add("@COMMENTS", Data.SqlDbType.VarChar, 150).Value = COMMENTS
                .Parameters.Add("@ACK_BY", Data.SqlDbType.VarChar, 150).Value = ACK_BY
                .Parameters.Add("@QUOTE_ALLOCATE_TO", Data.SqlDbType.VarChar, 150).Value = QUOTE_ALLOCATE_TO
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID

        End Function
        Public Function LEAD_QUOTE_REQ(ByVal Quote_Date As String, ByVal Quote_NO As String, ByVal Quote_Amt As Decimal, ByVal Quote_By As String, ByVal Lead_No As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_SALES_LEAD_QUOTE", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@QUOTE_DATE", Data.SqlDbType.VarChar, 50).Value = Quote_Date
                .Parameters.Add("@QUOTE_NO", Data.SqlDbType.VarChar, 50).Value = Quote_NO
                .Parameters.Add("@LEAD_NO", Data.SqlDbType.VarChar, 50).Value = Lead_No
                .Parameters.Add("@QUOTE_AMT", Data.SqlDbType.Decimal).Value = Quote_Amt
                .Parameters.Add("@QUOTE_BY", Data.SqlDbType.VarChar, 150).Value = Quote_By
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID

        End Function
        Public Function TENDER_APPROVE(ByVal BOOKING_NO As String, ByVal APPROVED_BY As String, ByVal APPROVED As String, ByVal COMMENTS As String, ByVal TENDER_STATUS As String, ByVal AWARDED_TO_INS As String, ByVal AWARDED_TO_AGENT As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_APPROVE_TENDER", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@BOOKING_NO", Data.SqlDbType.VarChar, 150).Value = BOOKING_NO
                .Parameters.Add("@APPROVED_BY", Data.SqlDbType.VarChar, 150).Value = APPROVED_BY
                .Parameters.Add("@APPROVED", Data.SqlDbType.VarChar, 150).Value = APPROVED
                .Parameters.Add("@COMMENTS", Data.SqlDbType.VarChar, 150).Value = COMMENTS

                .Parameters.Add("@TENDER_STATUS", Data.SqlDbType.VarChar, 150).Value = TENDER_STATUS
                .Parameters.Add("@AWARDED_TO_INS", Data.SqlDbType.VarChar, 150).Value = AWARDED_TO_INS
                .Parameters.Add("@AWARDED_TO_AGENT", Data.SqlDbType.VarChar, 150).Value = AWARDED_TO_AGENT

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID

        End Function
        Public Function RunExtract_Receipts(ByVal dtFrom As Date, ByVal dtTo As Date, ByVal cashier As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[SP_MIS_SALES_COLLECTION]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Rec_dateFrom", Data.SqlDbType.Date, 100).Value = dtFrom
                .Parameters.Add("@Rec_dateTo", Data.SqlDbType.Date, 100).Value = dtTo
                .Parameters.Add("@cashier", Data.SqlDbType.VarChar, 50).Value = cashier
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function UPLOAD_SALES_DOCS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal BOOKING_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal CORPORATE_CODE As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_SALES_DOC_upload", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@CORPORATE_CODE", Data.SqlDbType.VarChar, 150).Value = CORPORATE_CODE
                .Parameters.Add("@BOOKING_NO", Data.SqlDbType.VarChar, 150).Value = BOOKING_NO
                .Parameters.Add("@Doc_Title", Data.SqlDbType.VarChar, 150).Value = Doc_Title
                .Parameters.Add("@Doc_Date", Data.SqlDbType.VarChar, 150).Value = Doc_Date
                .Parameters.Add("@Upload_date", Data.SqlDbType.VarChar, 150).Value = Upload_date
                .Parameters.Add("@Upload_By", Data.SqlDbType.VarChar, 50).Value = Upload_By
                .Parameters.Add("@FILE_NAME", Data.SqlDbType.Text).Value = FILE_NAME
                .Parameters.Add("@Data", Data.SqlDbType.Binary).Value = bytes
                .Parameters.Add("@ContentType", SqlDbType.VarChar).Value = ContentType
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function TENDER_ANALYSIS(ByVal TENDER_NO As String, ByVal CORPORATE_CODE As String, ByVal CORPORATE_NAME As String, ByVal FLOAT_DT As String, ByVal CLOSE_DATE As String, ByVal TENDER_STATUS As String, ByVal IS_COMMITTEE As Integer, _
         ByVal CNT_TENDERS As Integer, ByVal ENTERED_BY As String, ByVal ENTERED_DATE As String, ByVal APPROVAL_STATUS As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_TENDER_ANALYSIS", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@TENDER_NO", Data.SqlDbType.VarChar, 150).Value = TENDER_NO
                '.Parameters.Add("@REFERENCE_NO", Data.SqlDbType.VarChar, 150).Value = REFERENCE_NO
                .Parameters.Add("@FLOAT_DT", Data.SqlDbType.VarChar, 50).Value = FLOAT_DT
                .Parameters.Add("@CLOSE_DATE", Data.SqlDbType.VarChar, 50).Value = CLOSE_DATE
                .Parameters.Add("@CORPORATE_NAME", Data.SqlDbType.VarChar, 150).Value = CORPORATE_NAME
                .Parameters.Add("@CORPORATE_CODE", Data.SqlDbType.VarChar, 150).Value = CORPORATE_CODE
                .Parameters.Add("@TENDER_STATUS", Data.SqlDbType.VarChar, 150).Value = TENDER_STATUS
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 150).Value = ENTERED_BY
                .Parameters.Add("@IS_COMMITTEE", Data.SqlDbType.Int).Value = IS_COMMITTEE
                .Parameters.Add("@CNT_TENDERS", Data.SqlDbType.Int).Value = CNT_TENDERS
                .Parameters.Add("@ENTRY_DATE", Data.SqlDbType.VarChar, 150).Value = ENTERED_DATE
                .Parameters.Add("@APPROVAL_STATUS", Data.SqlDbType.VarChar, 150).Value = APPROVAL_STATUS


                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TASK_MESSAGES(ByVal Proposer_id As String, ByVal Notes As String, ByVal Notes_by As String, ByVal Note_Date As DateTime, ByVal Notes_Type As String, ByVal FAMILY_NO As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DATA_REPOSITORY_DB].[dbo].[sp_MIS_CRM_RET_NOTES]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Proposer_id", Data.SqlDbType.VarChar, 50).Value = Proposer_id
                .Parameters.Add("@Notes", Data.SqlDbType.NVarChar, 500).Value = Notes
                .Parameters.Add("@Note_date", Data.SqlDbType.DateTime).Value = Note_Date
                .Parameters.Add("@Notes_by", Data.SqlDbType.VarChar, 50).Value = Notes_by
                .Parameters.Add("@Notes_Type", Data.SqlDbType.VarChar, 50).Value = Notes_Type
                .Parameters.Add("@FAMILY_NO", Data.SqlDbType.VarChar, 50).Value = FAMILY_NO
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TENDER_BOOKING(ByVal BOOKING_NO As String, ByVal TENDER_NO As String, ByVal BOOKING_DATE As String, ByVal DUE_DATE_TIME As DateTime, ByVal CORPORATE_NAME As String, ByVal CORPORATE_CODE As String, ByVal AGENT_ID As String, ByVal BRANCH As String, _
         ByVal ENTERED_BY As String, ByVal APPROVED As String, ByVal BUSINESS As String, ByVal TENDER_STATUS As String, ByVal BRANCH_CODE As String, ByVal LEAD_NO As String, ByVal Agent_Email As String, ByVal Mobile_No As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("dbo.SP_TENDER_BOOKING", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@TENDER_NO", Data.SqlDbType.VarChar, 150).Value = TENDER_NO
                .Parameters.Add("@BOOKING_NO", Data.SqlDbType.VarChar, 150).Value = BOOKING_NO
                .Parameters.Add("@BOOKING_DATE", Data.SqlDbType.VarChar, 150).Value = BOOKING_DATE
                .Parameters.Add("@DUE_DATE_TIME", Data.SqlDbType.DateTime).Value = DUE_DATE_TIME
                .Parameters.Add("@CORPORATE_NAME", Data.SqlDbType.VarChar, 150).Value = CORPORATE_NAME
                .Parameters.Add("@CORPORATE_CODE", Data.SqlDbType.VarChar, 150).Value = CORPORATE_CODE
                .Parameters.Add("@AGENT_ID", Data.SqlDbType.VarChar, 150).Value = AGENT_ID
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 150).Value = ENTERED_BY
                .Parameters.Add("@APPROVED", Data.SqlDbType.VarChar, 150).Value = APPROVED
                .Parameters.Add("@BRANCH", Data.SqlDbType.VarChar, 150).Value = BRANCH
                .Parameters.Add("@BRANCH_CODE", Data.SqlDbType.VarChar, 150).Value = BRANCH_CODE
                .Parameters.Add("@BUSINESS", Data.SqlDbType.VarChar, 150).Value = BUSINESS
                .Parameters.Add("@TENDER_STATUS", Data.SqlDbType.VarChar, 150).Value = TENDER_STATUS
                .Parameters.Add("@LEAD_NO", Data.SqlDbType.VarChar, 50).Value = LEAD_NO
                .Parameters.Add("@Agent_Email", Data.SqlDbType.VarChar, 150).Value = Agent_Email
                .Parameters.Add("@Mobile_No", Data.SqlDbType.VarChar, 50).Value = Mobile_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TASK_MESSAGES_CORP(ByVal Proposer_id As String, ByVal Notes As String, ByVal Notes_by As String, ByVal Note_Date As DateTime, ByVal Notes_Type As String, ByVal FAMILY_NO As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DATA_REPOSITORY_DB].dbo.sp_MIS_CRM_CORP_NOTES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Proposer_id", Data.SqlDbType.VarChar, 50).Value = Proposer_id
                .Parameters.Add("@Notes", Data.SqlDbType.NVarChar, 500).Value = Notes
                .Parameters.Add("@Note_date", Data.SqlDbType.DateTime).Value = Note_Date
                .Parameters.Add("@Notes_by", Data.SqlDbType.VarChar, 500).Value = Notes_by
                .Parameters.Add("@Notes_Type", Data.SqlDbType.VarChar, 50).Value = Notes_Type

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID
        End Function

        Public Function Save_Refund(ByVal Refund_No As String, ByVal File_No As String, ByVal Amount_Paid As Decimal, ByVal Refund_Amt As Decimal, ByVal Payee_Name As String, ByVal Payee_eMail As String, ByVal Payee_Mobile As String, ByVal Refund_Status As String, ByVal Refund_Type As String, ByVal Request_Dt As String, ByVal Entered_By As String, ByVal client As String, ByVal Proposer_ID As String, ByVal Proposer As String) As Integer
            '[Refund_No],[File_No],[Amount_Paid],[Refund_Amt] ,[Payee_Name],[Payee_eMail],[Payee_Mobile],[Refund_Status],[Refund_Type],[Request_Dt],Entered_By
            Dim myID As Double = 0
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("CRM.dbo.SP_Refund_Decline", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Refund_No", Data.SqlDbType.VarChar, 50).Value = Refund_No
                .Parameters.Add("@Amount_Paid", Data.SqlDbType.Decimal).Value = Amount_Paid
                .Parameters.Add("@Refund_Amt", Data.SqlDbType.Decimal).Value = Refund_Amt
                .Parameters.Add("@Payee_Name", Data.SqlDbType.VarChar, 150).Value = Payee_Name

                .Parameters.Add("@Payee_eMail", Data.SqlDbType.VarChar, 50).Value = Payee_eMail
                .Parameters.Add("@Payee_Mobile", Data.SqlDbType.VarChar, 50).Value = Payee_Mobile
                .Parameters.Add("@Refund_Status", Data.SqlDbType.VarChar, 50).Value = Refund_Status
                .Parameters.Add("@Refund_Type", Data.SqlDbType.VarChar, 50).Value = Refund_Type
                .Parameters.Add("@client_Type", Data.SqlDbType.VarChar, 50).Value = client
                .Parameters.Add("@Proposer_ID", Data.SqlDbType.VarChar, 50).Value = Proposer_ID
                .Parameters.Add("@Request_Dt", Data.SqlDbType.VarChar, 50).Value = Request_Dt
                .Parameters.Add("@Proposer", Data.SqlDbType.VarChar, 150).Value = Proposer
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TENDER_REGISTER(ByVal BOOKING_NO As String, ByVal TENDER_NO As String, ByVal BOOKING_DATE As String, ByVal DUE_DATE_TIME As DateTime, ByVal CORPORATE_NAME As String, ByVal CONT_PER_1 As String, ByVal CONT_PER_1_TITLE As String, ByVal CONT_PER_1_CONTACTS As String, _
        ByVal CONT_PER_2 As String, ByVal CONT_PER_2_TITLE As String, ByVal CONT_PER_2_CONTACTS As String, ByVal AGENT_ID As String, ByVal BRANCH As String, ByVal MAIN_AGENT As String, ByVal CURRENT_INSURER As String, _
        ByVal CURRENT_PREMIUMS As Decimal, ByVal CLAIM_RATIO As Decimal, ByVal ENTERED_BY As String, ByVal APPROVED As String, ByVal STS As Integer, ByVal COMMENTS As String, ByVal BUSINESS As String, ByVal INITIALS As String, ByVal TENDER_STATUS As String, ByVal BRANCH_CODE As String, ByVal LEAD_NO As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_REGISTER_TENDER", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@TENDER_NO", Data.SqlDbType.VarChar, 150).Value = TENDER_NO
                .Parameters.Add("@BOOKING_NO", Data.SqlDbType.VarChar, 150).Value = BOOKING_NO
                .Parameters.Add("@BOOKING_DATE", Data.SqlDbType.VarChar, 150).Value = BOOKING_DATE
                .Parameters.Add("@DUE_DATE_TIME", Data.SqlDbType.DateTime).Value = DUE_DATE_TIME
                .Parameters.Add("@CORPORATE_NAME", Data.SqlDbType.VarChar, 150).Value = CORPORATE_NAME
                .Parameters.Add("@CONT_PER_1", Data.SqlDbType.VarChar, 150).Value = CONT_PER_1
                .Parameters.Add("@CONT_PER_1_TITLE", Data.SqlDbType.VarChar, 150).Value = CONT_PER_1_TITLE
                .Parameters.Add("@CONT_PER_1_CONTACTS", Data.SqlDbType.VarChar, 150).Value = CONT_PER_1_CONTACTS
                .Parameters.Add("@CONT_PER_2", Data.SqlDbType.VarChar, 150).Value = CONT_PER_2
                .Parameters.Add("@CONT_PER_2_TITLE", Data.SqlDbType.VarChar, 150).Value = CONT_PER_2_TITLE
                .Parameters.Add("@CONT_PER_2_CONTACTS", Data.SqlDbType.VarChar, 150).Value = CONT_PER_2_CONTACTS
                .Parameters.Add("@AGENT_ID", Data.SqlDbType.VarChar, 150).Value = AGENT_ID
                .Parameters.Add("@MAIN_AGENT", Data.SqlDbType.VarChar, 150).Value = MAIN_AGENT
                .Parameters.Add("@CURRENT_INSURER", Data.SqlDbType.VarChar, 150).Value = CURRENT_INSURER
                .Parameters.Add("@CURRENT_PREMIUMS", Data.SqlDbType.Decimal).Value = CURRENT_PREMIUMS
                .Parameters.Add("@CLAIM_RATIO", Data.SqlDbType.Decimal).Value = CLAIM_RATIO
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 150).Value = ENTERED_BY
                .Parameters.Add("@APPROVED", Data.SqlDbType.VarChar, 150).Value = APPROVED
                .Parameters.Add("@BRANCH", Data.SqlDbType.VarChar, 150).Value = BRANCH
                .Parameters.Add("@BRANCH_CODE", Data.SqlDbType.VarChar, 150).Value = BRANCH_CODE
                .Parameters.Add("@BUSINESS", Data.SqlDbType.VarChar, 150).Value = BUSINESS
                .Parameters.Add("@COMMENTS", Data.SqlDbType.VarChar, 150).Value = COMMENTS
                .Parameters.Add("@STS", Data.SqlDbType.VarChar, 150).Value = STS
                .Parameters.Add("@INITIALS", Data.SqlDbType.VarChar, 150).Value = INITIALS
                .Parameters.Add("@TENDER_STATUS", Data.SqlDbType.VarChar, 150).Value = TENDER_STATUS
                .Parameters.Add("@LEAD_NO", Data.SqlDbType.VarChar, 50).Value = LEAD_NO
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function ENROLL_UPDATE_EMAIL(ByVal FROMDT As Date, ByVal TODT As Date, ByVal USER_ID As String, ByVal EMAIL_SEND As Boolean, ByVal USER_TYPE As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("COMMISSION.[dbo].SP_UPDATE_EMAIL", myConnection)
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@FROMDT", Data.SqlDbType.Date, 100).Value = FROMDT
                .Parameters.Add("@TODT", Data.SqlDbType.Date, 100).Value = TODT
                .Parameters.Add("@USER_ID", Data.SqlDbType.VarChar, 150).Value = USER_ID
                .Parameters.Add("@EMAIL_SEND", Data.SqlDbType.Bit, 150).Value = EMAIL_SEND
                .Parameters.Add("@USER_TYPE", Data.SqlDbType.VarChar, 50).Value = USER_TYPE
                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function REG_CORPORATE(ByVal CORPORATE_CODE As String, ByVal CORPORATE_NAME As String, ByVal INITIALS As String, ByVal ENTERED_BY As String, ByVal ENTRY_DATE As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[REG_CORPORATE]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@CORPORATE_CODE", Data.SqlDbType.VarChar, 50).Value = CORPORATE_CODE
                .Parameters.Add("@CORPORATE_NAME", Data.SqlDbType.VarChar, 200).Value = CORPORATE_NAME
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 50).Value = ENTERED_BY
                .Parameters.Add("@INITIALS", Data.SqlDbType.VarChar, 50).Value = INITIALS
                .Parameters.Add("@ENTRY_DATE", Data.SqlDbType.VarChar, 50).Value = ENTRY_DATE
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function MIS_IMPORT_PROPOSER(ByVal PERIOD_FROM As Date, ByVal PERIOD_TO As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[SP_FETCH_PROPOSER_DETAILS]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@PERIOD_FROM", Data.SqlDbType.Date, 100).Value = PERIOD_FROM
                .Parameters.Add("@PERIOD_TO", Data.SqlDbType.Date, 200).Value = PERIOD_TO
                '.Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function MIS_SALES_DEBITS_UPDATE(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[SP_MISREPORTS_SUMMARY_BALANCES]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@Rec_dateFrom", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@Rec_dateTo", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                '.Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function UpdateProfile(ByVal strProfileID As String, ByVal strProfileName As String, ByVal strProfileType As String, ByVal strRemarks As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("UpDate_Profile", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@PROFILENAME", Data.SqlDbType.VarChar, 100).Value = strProfileName
                .Parameters.Add("@PROFILETYPE", Data.SqlDbType.VarChar, 200).Value = strProfileType
                .Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function AddAdminAuditTrail(ByVal Myusername As String, ByVal Myactiontype As String, _
        ByVal Myactiondescription As String, ByVal Mypageaccessed As String, _
        ByVal Myclientipaddress As String, ByVal Mysessionid As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("Add_AdminAuditTrail", myConnection)

            'Try
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@username", Data.SqlDbType.VarChar, 50).Value = Myusername
                .Parameters.Add("@actiontype", Data.SqlDbType.VarChar, 50).Value = Myactiontype
                .Parameters.Add("@actiondescription", Data.SqlDbType.VarChar, 150).Value = Myactiondescription
                .Parameters.Add("@pageaccessed", Data.SqlDbType.VarChar, 100).Value = Mypageaccessed
                .Parameters.Add("@clientipaddress", Data.SqlDbType.VarChar, 50).Value = Myclientipaddress
                .Parameters.Add("@sessionid", Data.SqlDbType.VarChar, 50).Value = Mysessionid
                .ExecuteNonQuery()
                myID = .Parameters.Item("@ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function AddEmployees(ByVal strProfileID As String, ByVal addedby As String, ByVal strEmployeeName As String, _
        ByVal strTitle As String, ByVal strTelExt As String, ByVal strCellphone As String, _
        ByVal strEmail As String, ByVal strUserName As String, ByVal strOtherEmail As String, _
        ByVal IntDaysToLockUser As Int16, ByVal IntUserLocked As Int16, ByVal strMyPassword As String, _
        ByVal activated As Boolean, ByVal Department As String, Optional ByVal RecordStatus As String = "New Record") As Int32

            Dim MyEmployeeID As Int32 = 0
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("Add_Employee", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@EmployeeID", Data.SqlDbType.Int, 4).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@addedby", Data.SqlDbType.VarChar, 50).Value = addedby
                .Parameters.Add("@EmployeeName", Data.SqlDbType.VarChar, 50).Value = strEmployeeName
                .Parameters.Add("@Title", Data.SqlDbType.VarChar, 20).Value = strTitle
                .Parameters.Add("@TelExt", Data.SqlDbType.VarChar, 20).Value = strTelExt
                .Parameters.Add("@CellPhone", Data.SqlDbType.VarChar, 200).Value = strCellphone
                .Parameters.Add("@Email", Data.SqlDbType.VarChar, 200).Value = strEmail
                .Parameters.Add("@UserName", Data.SqlDbType.VarChar, 200).Value = strUserName
                .Parameters.Add("@DaysTolockUser", Data.SqlDbType.Int).Value = IntDaysToLockUser
                .Parameters.Add("@OtherEmail", Data.SqlDbType.VarChar, 200).Value = strOtherEmail
                .Parameters.Add("@Password", Data.SqlDbType.VarChar, 500).Value = strMyPassword
                .Parameters.Add("@Department", Data.SqlDbType.VarChar, 200).Value = Department

                .ExecuteNonQuery()
                MyEmployeeID = .Parameters.Item("@EmployeeID").Value.ToString
            End With

            myConnection.Close()
            Return CInt(MyEmployeeID)

        End Function
        Public Function UpdateEmployees(ByVal strEmployeeID As String, ByVal approvedBy As String, ByVal approved As Boolean, _
        ByVal strProfileID As String, ByVal strEmployeeName As String, ByVal strTitle As String, ByVal strTelExt As String, _
        ByVal strHomePhone As String, ByVal strCellphone As String, ByVal strEmail As String, ByVal strUserName As String, _
        ByVal Password As String, ByVal strOtherEmail As String, ByVal IntDaysToLockUser As Int16, ByVal IntUserLocked As Int16, _
        ByVal MODIFIEDBY As String, ByVal department As String, Optional ByVal RecordStatus As String = "Update", Optional ByVal EmailSent As Boolean = False) As Boolean


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("UpDate_Employee", myConnection)

            With myCommand


                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@EmployeeID", Data.SqlDbType.Int, 4).Value = strEmployeeID
                .Parameters.Add("@EmployeeName", Data.SqlDbType.VarChar, 100).Value = strEmployeeName
                .Parameters.Add("@Title", Data.SqlDbType.VarChar, 100).Value = strTitle
                .Parameters.Add("@HomePhone", Data.SqlDbType.VarChar, 20).Value = strHomePhone
                .Parameters.Add("@TelExt", Data.SqlDbType.VarChar, 20).Value = strTelExt
                .Parameters.Add("@CellPhone", Data.SqlDbType.VarChar, 20).Value = strCellphone
                .Parameters.Add("@OtherEmail", Data.SqlDbType.VarChar, 100).Value = strOtherEmail
                .Parameters.Add("@Email", Data.SqlDbType.VarChar, 100).Value = strEmail
                .Parameters.Add("@UserName", Data.SqlDbType.VarChar, 50).Value = strUserName
                .Parameters.Add("@DaysTolockUser", Data.SqlDbType.Int).Value = IntDaysToLockUser
                .Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@Locked", Data.SqlDbType.Bit).Value = IntUserLocked
                .Parameters.Add("@MODIFIEDBY", Data.SqlDbType.VarChar, 100).Value = MODIFIEDBY
                .Parameters.Add("@Password", Data.SqlDbType.VarChar, 100).Value = Password
                .Parameters.Add("@approved", Data.SqlDbType.Bit, 1).Value = approved
                .Parameters.Add("@department", Data.SqlDbType.VarChar, 100).Value = department


                ''.Parameters.Add("@CanDoDeletion", Data.SqlDbType.Bit).Value = CanDoDeletion
                ' .Parameters.Add("@RecordStatus", Data.SqlDbType.VarChar, 50).Value = RecordStatus
                '.Parameters.Add("@EmailSent", Data.SqlDbType.Bit).Value = EmailSent

                .ExecuteNonQuery()
            End With

            Return True
        End Function
        Public Function DbInterface(ByVal Mode As String, ByVal ID As Integer, ByVal TableName As String, ByVal Columns As String, ByVal Values As String) As Int32

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim MyDataReader As SqlDataReader = Nothing
            Dim myCommand As New SqlCommand("ASP_ExecuteTable", myConnection)

            Dim MYID As New SqlParameter("@ID", SqlDbType.Int)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                MYID.Direction = ParameterDirection.ReturnValue
                'If ID = 0 Then
                '    .Parameters.Add("@ID", Data.SqlDbType.Int).Direction = Data.ParameterDirection.ReturnValue
                'Else

                'End If
                .Parameters.Add(MYID)
                .Parameters.Add("@ID", Data.SqlDbType.Int).Value = ID
                .Parameters.Add("@Mode", Data.SqlDbType.Int).Value = Mode
                .Parameters.Add("@TableName", Data.SqlDbType.VarChar).Value = TableName
                .Parameters.Add("@Columns", Data.SqlDbType.VarChar, 7000).Value = Columns
                .Parameters.Add("@Values", Data.SqlDbType.VarChar, 7000).Value = Values
                MyDataReader = .ExecuteReader()
                If MyDataReader.HasRows Then
                    ID = MyDataReader(0)
                End If
                Dim RetID As Integer = Convert.ToInt32(MYID.Value)
                DbInterface = RetID
            End With
            myConnection.Close()

            Return DbInterface
        End Function
        Public Sub DeactivateSignatory(ByVal MySignatoryID As Int32)

            Dim DecryptedStr As String = Nothing

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)

            myConnection.Open()

            Dim myCommand As New SqlCommand("Deactivate_Signatory", myConnection)

            Try
                With myCommand
                    .CommandType = Data.CommandType.StoredProcedure
                    .Parameters.Add("@SignatoryID", Data.SqlDbType.Real).Value = MySignatoryID
                    .Parameters.Add("@Activated", Data.SqlDbType.Int).Value = 0
                    .ExecuteNonQuery()

                End With

                myConnection.Close()

            Catch ex As Exception
                CType(myCommand, IDisposable).Dispose()
            Finally
                myConnection.Close()
            End Try

        End Sub
        Public Function RunExtract_RM(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[dbo].[sp_MIS_sales_production_act_RM]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@dateFrom", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@dateTo", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function RunExtract_BM(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[dbo].[sp_MIS_sales_production_act_BM]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@dateFrom", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@dateTo", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function RunExtract_um(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[dbo].[sp_MIS_sales_production_act_UM]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@dateFrom", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@dateTo", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function RunExtract(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[SP_MIS_SALES_PRODUCTION]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Rec_dateFrom", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@Rec_dateTo", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function MEMBERSHIP_ENROLL_BUSINESS(ByVal File_No As String, ByVal Member_No As String, ByVal Card_activated As Integer, ByVal Card_activated_date As String, ByVal Business_Type As String, ByVal Proposer_Name As String, ByVal Type As String, _
      ByVal Mem_Receive_date As String, ByVal Receive_From As String, ByVal Agent As String, ByVal Benefit As String, ByVal Population As Decimal, ByVal Premium As Decimal, _
      ByVal Returned As Integer, ByVal Returned_rec As Integer, ByVal Complete_Business As Integer, ByVal Membership_Comments As String, ByVal Returned_To As String, ByVal Date_returned As String, ByVal Return_rec_date As String, ByVal Assigned_To As String, ByVal Date_assigned As String, ByVal STATUS As String, ByVal ST As Integer, ByVal username As String, ByVal aarcredit As Integer, ByVal To_Med_underwriter As Integer, ByVal Frm_Med_underwriter As Integer) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_ENROLL_CORPORATE_BUSINESS", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 150).Value = File_No
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 150).Value = Member_No
                .Parameters.Add("@Card_activated", Data.SqlDbType.Int).Value = Card_activated
                .Parameters.Add("@Card_activated_date", Data.SqlDbType.VarChar, 150).Value = Card_activated_date
                .Parameters.Add("@Business_Type", Data.SqlDbType.VarChar, 150).Value = Business_Type
                .Parameters.Add("@Proposer_Name", Data.SqlDbType.VarChar, 150).Value = Proposer_Name
                .Parameters.Add("@Type", Data.SqlDbType.VarChar, 150).Value = Type
                '.Parameters.Add("@BRANCH_CODE", Data.SqlDbType.VarChar, 50).Value = BRANCH_CODE
                .Parameters.Add("@Mem_Receive_date", Data.SqlDbType.VarChar, 50).Value = Mem_Receive_date
                .Parameters.Add("@Receive_From", Data.SqlDbType.VarChar, 50).Value = Receive_From
                .Parameters.Add("@Agent", Data.SqlDbType.VarChar, 150).Value = Agent
                .Parameters.Add("@Benefit", Data.SqlDbType.VarChar, 150).Value = Benefit
                .Parameters.Add("@Population", Data.SqlDbType.Decimal).Value = Population
                .Parameters.Add("@Premium", Data.SqlDbType.Decimal).Value = Premium
                .Parameters.Add("@Membership_Comments", Data.SqlDbType.NVarChar, 250).Value = Membership_Comments
                '.Parameters.Add("@BRANCH_CODE", Data.SqlDbType.VarChar, 50).Value = BRANCH_CODE
                .Parameters.Add("@Returned_To", Data.SqlDbType.VarChar, 50).Value = Returned_To
                .Parameters.Add("@Date_returned", Data.SqlDbType.VarChar, 50).Value = Date_returned
                .Parameters.Add("@Return_rec_date", Data.SqlDbType.VarChar, 50).Value = Return_rec_date
                .Parameters.Add("@Assigned_To", Data.SqlDbType.VarChar, 50).Value = Assigned_To
                .Parameters.Add("@Date_assigned", Data.SqlDbType.VarChar, 50).Value = Date_assigned
                '.Parameters.Add("@Card_activated", Data.SqlDbType.VarChar, 50).Value = Card_activated
                .Parameters.Add("@entered_by", Data.SqlDbType.VarChar, 50).Value = username
                .Parameters.Add("@Status", Data.SqlDbType.VarChar, 50).Value = STATUS
                .Parameters.Add("@ST", Data.SqlDbType.Int).Value = ST
                .Parameters.Add("@Returned", Data.SqlDbType.Int).Value = Returned
                .Parameters.Add("@Returned_rec", Data.SqlDbType.Int).Value = Returned_rec
                .Parameters.Add("@Complete_Business", Data.SqlDbType.Int).Value = Complete_Business
                .Parameters.Add("@aarcredit", Data.SqlDbType.Int).Value = aarcredit

                .Parameters.Add("@To_Med_underwriter", Data.SqlDbType.Int).Value = To_Med_underwriter
                .Parameters.Add("@Frm_Med_underwriter", Data.SqlDbType.Int).Value = Frm_Med_underwriter
                '.Parameters.Add("@TERMINATED", Data.SqlDbType.VarChar, 50).Value = TERMINATED
                '.Parameters.Add("@TERMI_DATE", Data.SqlDbType.VarChar, 50).Value = TERMI_DATE


                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function UPLOAD_ITEMS(ByVal File_No As String, ByVal DOC_CODE As String, ByVal DOC_Title As String, ByVal Entry_Date As String, ByVal Entered_By As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.[sp_File_Doc_update]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@DOC_CODE", Data.SqlDbType.VarChar, 50).Value = DOC_CODE
                .Parameters.Add("@Doc_Title", Data.SqlDbType.VarChar, 100).Value = DOC_Title
                .Parameters.Add("@Entry_Date", Data.SqlDbType.VarChar, 50).Value = Entry_Date
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By

                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function COMMISSION_DEBITS_CREDITS(AGENT_ID As String, PROPOSER_DISPLAY_NAME As String, BUSINESS_TYPE As String, PREM_RECEIPT_NO As String, REF_RECEIPT_NO As String, PREM_RECEIPT_DATE As String, COMMISSION As Decimal, BUSINESS As String, IS_CR_DR As Integer) As Integer
            Dim num As Double = 0.0
            Dim text As String = "rijndael"
            Dim cryptoFactory As DocManagementSecurity.CryptoFactory = New DocManagementSecurity.CryptoFactory()
            Dim crypto As DocManagementSecurity.ICrypto = cryptoFactory.MakeCryptographer(text)
            Dim text2 As String = crypto.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)
            Dim sqlConnection As SqlConnection = New SqlConnection(text2)
            sqlConnection.Open()
            Dim sqlCommand As SqlCommand = New SqlCommand("COMMISSION.dbo.[SP_COMMISSION_SUMMARY_CREDITS]", sqlConnection)
            Dim sqlCommand2 As SqlCommand = sqlCommand
            sqlCommand2.CommandType = CommandType.StoredProcedure
            sqlCommand2.Parameters.Add("@AGENT_ID", SqlDbType.NVarChar, 50).Value = AGENT_ID
            sqlCommand2.Parameters.Add("@PROPOSER_DISPLAY_NAME", SqlDbType.VarChar, 150).Value = PROPOSER_DISPLAY_NAME
            sqlCommand2.Parameters.Add("@BUSINESS_TYPE", SqlDbType.VarChar, 50).Value = BUSINESS_TYPE
            sqlCommand2.Parameters.Add("@PREM_RECEIPT_NO", SqlDbType.VarChar, 50).Value = PREM_RECEIPT_NO
            sqlCommand2.Parameters.Add("@REF_RECEIPT_NO", SqlDbType.VarChar, 50).Value = REF_RECEIPT_NO
            sqlCommand2.Parameters.Add("@PREM_RECEIPT_DATE", SqlDbType.VarChar, 50).Value = PREM_RECEIPT_DATE
            sqlCommand2.Parameters.Add("@RECEIPT_AMOUNT", SqlDbType.[Decimal]).Value = COMMISSION
            sqlCommand2.Parameters.Add("@BUSINESS", SqlDbType.NVarChar, 50).Value = BUSINESS
            sqlCommand2.Parameters.Add("@IS_CR_DR", SqlDbType.Int).Value = IS_CR_DR
            sqlCommand2.ExecuteNonQuery()
            sqlConnection.Close()
            Return CInt(Math.Round(num))
        End Function
        Public Function Process_Commission_Recon(Rec_dateFrom As DateTime) As Boolean
            Dim text As String = "rijndael"
            Dim cryptoFactory As DocManagementSecurity.CryptoFactory = New DocManagementSecurity.CryptoFactory()
            Dim crypto As DocManagementSecurity.ICrypto = cryptoFactory.MakeCryptographer(text)
            Dim text2 As String = crypto.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)
            Dim sqlConnection As SqlConnection = New SqlConnection(text2)
            sqlConnection.Open()
            Dim sqlCommand As SqlCommand = New SqlCommand("[COMMISSION].[dbo].[SP_UPDATE_PAID_AND_RECONCILE]", sqlConnection) With {.CommandTimeout = 0}
            sqlCommand.CommandType = CommandType.StoredProcedure
            sqlCommand.Parameters.Add("@CUTOFF_FROM_DT", SqlDbType.[Date], 50).Value = Rec_dateFrom
            sqlCommand.ExecuteNonQuery()
            sqlConnection.Close()
            Return True
        End Function
        Public Function MIS_SALES_INTERMEDIARY(REF_NO As String, AGENT_NAME As String, AGENT_TYPE As String, UNIT_CODE As String, REGION_CODE As String, COMMISSION_RATE As Double, EMAIL As String, MOBILE_NO As Integer, PIN_NO As String, SEC_MOBILE_NO As String, PAY_MODE As Integer, Entered_By As String, Receive_date As String, NID As String, Contract_date As String, Payroll_No As String, Agent_code As String, Name_Changed As String, Integrated As Integer, GI_Mgr As String) As Boolean
            Dim text As String = "rijndael"
            Dim cryptoFactory As DocManagementSecurity.CryptoFactory = New DocManagementSecurity.CryptoFactory()
            Dim crypto As DocManagementSecurity.ICrypto = cryptoFactory.MakeCryptographer(text)
            Dim text2 As String = crypto.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)
            Dim sqlConnection As SqlConnection = New SqlConnection(text2)
            sqlConnection.Open()
            Dim sqlCommand As SqlCommand = New SqlCommand("[DB_MASTER_AGENTS].[dbo].[SP_MIS_SALES_INTERMEDIARY]", sqlConnection)
            Dim sqlCommand2 As SqlCommand = sqlCommand
            sqlCommand2.CommandType = CommandType.StoredProcedure
            sqlCommand2.Parameters.Add("@REF_NO", SqlDbType.VarChar, 50).Value = REF_NO
            sqlCommand2.Parameters.Add("@AGENT_NAME", SqlDbType.VarChar, 50).Value = AGENT_NAME
            sqlCommand2.Parameters.Add("@AGENT_TYPE", SqlDbType.VarChar, 50).Value = AGENT_TYPE
            sqlCommand2.Parameters.Add("@UNIT_CODE", SqlDbType.VarChar, 10).Value = UNIT_CODE
            sqlCommand2.Parameters.Add("@REGION_CODE", SqlDbType.VarChar, 50).Value = REGION_CODE
            sqlCommand2.Parameters.Add("@COMMISSION_RATE", SqlDbType.[Decimal]).Value = COMMISSION_RATE
            sqlCommand2.Parameters.Add("@EMAIL", SqlDbType.VarChar, 50).Value = EMAIL
            sqlCommand2.Parameters.Add("@MOBILE_NO", SqlDbType.VarChar, 50).Value = MOBILE_NO
            sqlCommand2.Parameters.Add("@PIN_NO", SqlDbType.VarChar, 50).Value = PIN_NO
            sqlCommand2.Parameters.Add("@SEC_MOBILE_NO", SqlDbType.VarChar, 50).Value = SEC_MOBILE_NO
            sqlCommand2.Parameters.Add("@Entered_By", SqlDbType.VarChar, 50).Value = Entered_By
            sqlCommand2.Parameters.Add("@Receive_date", SqlDbType.VarChar, 25).Value = Receive_date
            sqlCommand2.Parameters.Add("@NID", SqlDbType.VarChar, 20).Value = NID
            sqlCommand2.Parameters.Add("@PAY_MODE", SqlDbType.Int).Value = PAY_MODE
            sqlCommand2.Parameters.Add("@Contract_Date", SqlDbType.VarChar, 20).Value = Contract_date
            sqlCommand2.Parameters.Add("@Payroll_No", SqlDbType.VarChar, 10).Value = Payroll_No
            sqlCommand2.Parameters.Add("@Agent_code", SqlDbType.VarChar, 10).Value = Agent_code
            sqlCommand2.Parameters.Add("@Name_Changed", SqlDbType.VarChar, 5).Value = Name_Changed
            sqlCommand2.Parameters.Add("@ETIMS_VERIFIED", SqlDbType.Int).Value = Integrated
            sqlCommand2.Parameters.Add("@GI_Code", SqlDbType.VarChar, 10).Value = GI_Mgr
            sqlCommand2.ExecuteNonQuery()
            sqlConnection.Close()
            Return True
        End Function
        Public Function Add_Directors(ByVal REF_NO As String, ByVal NAME As String, ByVal EMAIL As String, ByVal MOBILE_NO As String, ByVal NID_NO As String, ByVal PIN_NO As String, ByVal ENTERED_BY As String, ByVal STS As Integer) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DB_MASTER_AGENTS].dbo.SP_SALES_DIRECTOR", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@REF_NO", Data.SqlDbType.VarChar, 50).Value = REF_NO
                .Parameters.Add("@NAME", Data.SqlDbType.VarChar, 50).Value = NAME
                .Parameters.Add("@EMAIL", Data.SqlDbType.VarChar, 50).Value = EMAIL
                .Parameters.Add("@MOBILE_NO", Data.SqlDbType.VarChar, 50).Value = MOBILE_NO
                .Parameters.Add("@NID_NO", Data.SqlDbType.VarChar, 50).Value = NID_NO
                .Parameters.Add("@PIN_NO", Data.SqlDbType.VarChar, 50).Value = PIN_NO
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 50).Value = ENTERED_BY
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function

        Public Function NameChange(ByVal REF_NO As String, ByVal NAME_TO As String, ByVal ENTRY_BY As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DB_MASTER_AGENTS].dbo.SP_AGENT_NAME_CHANGE", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@REF_NO", Data.SqlDbType.VarChar, 50).Value = REF_NO
                .Parameters.Add("@ENTRY_BY", Data.SqlDbType.VarChar, 50).Value = ENTRY_BY
                .Parameters.Add("@NAME_TO", Data.SqlDbType.VarChar, 200).Value = NAME_TO

                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function COMMISSION_AGENTS_UPDATE(ByVal REF_NO As String, ByVal N_1 As Integer) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DB_MASTER_AGENTS].dbo.SP_COMMISSION_AGENTS_UPDATE", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@REF_NO", Data.SqlDbType.VarChar, 50).Value = REF_NO
                .Parameters.Add("@N_1", Data.SqlDbType.Int).Value = N_1
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function IMPORT_NEW_AGENTS(ByVal ENTRY_BY As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DB_MASTER_AGENTS].dbo.MIS_SALES_AGEN_EXTRACT", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@ENTRY_BY", Data.SqlDbType.VarChar, 50).Value = ENTRY_BY

                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function UPLOAD_File_ADD_LICENCE(ByVal REF_NO As String, ByVal LICENCE_NO As String, ByVal VALID_FROM As String, ByVal VALID_TO As String, ByVal ENTRY_BY As String, ByVal VERIFIED As Integer, ByVal Waiver As Integer, ByVal KYC As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DB_MASTER_AGENTS].dbo.SP_ADD_CONTRACT_DETAILS", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@REF_NO", Data.SqlDbType.VarChar, 50).Value = REF_NO
                .Parameters.Add("@LICENCE_NO", Data.SqlDbType.VarChar, 50).Value = LICENCE_NO
                .Parameters.Add("@VALID_FROM", Data.SqlDbType.VarChar, 50).Value = VALID_FROM
                .Parameters.Add("@VALID_TO", Data.SqlDbType.VarChar, 50).Value = VALID_TO
                .Parameters.Add("@ENTRY_BY", Data.SqlDbType.VarChar, 50).Value = ENTRY_BY
                .Parameters.Add("@VERIFIED", Data.SqlDbType.Int).Value = VERIFIED
                .Parameters.Add("@Waiver", Data.SqlDbType.Int).Value = Waiver
                .Parameters.Add("@KYC", Data.SqlDbType.VarChar, 5).Value = KYC
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function VALIDATE_HRMIS(ByVal HRMIS_CODE As String, ByVal USER_DISPLAY_NAME As String, ByVal DEDUCTION_CODE As String, ByVal DR As Decimal, ByVal CUTOFF_FROM_DT As String, ByVal CUTOFF_TO_DT As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[COMMISSION].dbo.SP_VALIDATE_HRMIS", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@HRMIS_CODE", Data.SqlDbType.VarChar, 150).Value = HRMIS_CODE
                .Parameters.Add("@USER_DISPLAY_NAME", Data.SqlDbType.VarChar, 150).Value = USER_DISPLAY_NAME
                .Parameters.Add("@DEDUCTION_CODE", Data.SqlDbType.VarChar, 150).Value = DEDUCTION_CODE
                .Parameters.Add("@DR", Data.SqlDbType.Decimal).Value = DR
                .Parameters.Add("@CUTOFF_FROM_DT", Data.SqlDbType.VarChar, 150).Value = CUTOFF_FROM_DT
                .Parameters.Add("@CUTOFF_TO_DT", Data.SqlDbType.VarChar, 150).Value = CUTOFF_TO_DT

                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function FUND_UPLOAD(ByVal HRMIS_CODE As String, ByVal PRINCIPLE_AMT As Double, ByVal DR As Double, ByVal CR As Double, _
        ByVal DEDUCTION_CODE As String, ByVal PREM_RECEIPT_NO As String, ByVal PREM_RECEIPT_DATE As String, ByVal CUTOFF_FROM_DT As String, ByVal CUTOFF_TO_DT As String, ByVal ENTERED_BY As String, ByVal TRANS_TYPE As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[COMMISSION].dbo.SP_UPLOAD_FUND", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@HRMIS_CODE", Data.SqlDbType.VarChar, 150).Value = HRMIS_CODE
                .Parameters.Add("@PRINCIPLE_AMT", Data.SqlDbType.Decimal).Value = PRINCIPLE_AMT
                .Parameters.Add("@DR", Data.SqlDbType.Decimal).Value = DR
                .Parameters.Add("@CR", Data.SqlDbType.Decimal).Value = CR
                .Parameters.Add("@DEDUCTION_CODE", Data.SqlDbType.VarChar, 150).Value = DEDUCTION_CODE
                .Parameters.Add("@PREM_RECEIPT_NO", Data.SqlDbType.VarChar, 150).Value = PREM_RECEIPT_NO
                .Parameters.Add("@PREM_RECEIPT_DATE", Data.SqlDbType.VarChar, 50).Value = PREM_RECEIPT_DATE
                .Parameters.Add("@CUTOFF_FROM_DT", Data.SqlDbType.VarChar, 50).Value = CUTOFF_FROM_DT
                .Parameters.Add("@CUTOFF_TO_DT", Data.SqlDbType.VarChar, 50).Value = CUTOFF_TO_DT
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 50).Value = ENTERED_BY
                .Parameters.Add("@TRANS_TYPE", Data.SqlDbType.VarChar, 10).Value = TRANS_TYPE
                '.Parameters.Add("@sts", Data.SqlDbType.Int).Value = sts
                .ExecuteNonQuery()
            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function DEDUCTIONS(ByVal HRMIS_CODE As String, ByVal PRINCIPLE_AMT As Double, ByVal DR As Double, ByVal CR As Double, _
        ByVal DEDUCTION_CODE As String, ByVal PREM_RECEIPT_NO As String, ByVal PREM_RECEIPT_DATE As String, ByVal CUTOFF_FROM_DT As String, ByVal CUTOFF_TO_DT As String, ByVal ENTERED_BY As String, ByVal TRANS_TYPE As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[COMMISSION].dbo.UPLOAD_DEDUCTIONS", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@HRMIS_CODE", Data.SqlDbType.VarChar, 150).Value = HRMIS_CODE
                .Parameters.Add("@PRINCIPLE_AMT", Data.SqlDbType.Decimal).Value = PRINCIPLE_AMT
                .Parameters.Add("@DR", Data.SqlDbType.Decimal).Value = DR
                .Parameters.Add("@CR", Data.SqlDbType.Decimal).Value = CR
                .Parameters.Add("@DEDUCTION_CODE", Data.SqlDbType.VarChar, 150).Value = DEDUCTION_CODE
                .Parameters.Add("@PREM_RECEIPT_NO", Data.SqlDbType.VarChar, 150).Value = PREM_RECEIPT_NO
                .Parameters.Add("@PREM_RECEIPT_DATE", Data.SqlDbType.VarChar, 50).Value = PREM_RECEIPT_DATE
                .Parameters.Add("@CUTOFF_FROM_DT", Data.SqlDbType.VarChar, 50).Value = CUTOFF_FROM_DT
                .Parameters.Add("@CUTOFF_TO_DT", Data.SqlDbType.VarChar, 50).Value = CUTOFF_TO_DT
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 50).Value = ENTERED_BY
                .Parameters.Add("@TRANS_TYPE", Data.SqlDbType.VarChar, 10).Value = TRANS_TYPE
                '.Parameters.Add("@sts", Data.SqlDbType.Int).Value = sts
                .ExecuteNonQuery()
            End With
            myConnection.Close()
            Return myID

        End Function

        Public Function Agent_Mapping(ByVal REF_NO As String, ByVal FROM_ID As String, ByVal TO_ID As String, ByVal ENTRY_BY As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DB_MASTER_AGENTS].[dbo].[SP_AGENT_MAPPING]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@REF_NO", Data.SqlDbType.VarChar, 50).Value = REF_NO
                .Parameters.Add("@FROM_ID", Data.SqlDbType.VarChar, 50).Value = FROM_ID
                .Parameters.Add("@TO_ID", Data.SqlDbType.VarChar, 50).Value = TO_ID
                .Parameters.Add("@ENTRY_BY", Data.SqlDbType.VarChar, 50).Value = ENTRY_BY

                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function Agent_Deactivate(ByVal REF_NO As String, ByVal Action As String, ByVal ENTRY_BY As String, ByVal Reason As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DB_MASTER_AGENTS].[dbo].[MIS_SALES_AGEN_SUSPEND_TERM]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@REF_NO", Data.SqlDbType.VarChar, 50).Value = REF_NO
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 50).Value = Action
                .Parameters.Add("@ENTRY_BY", Data.SqlDbType.VarChar, 50).Value = ENTRY_BY
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 50).Value = Reason
                 
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function UPLOAD_File_DOC_CONTRACT(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String, ByVal Licence_No As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_DOC_upload_Agent_Contract", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@DOC_ID", Data.SqlDbType.VarChar, 50).Value = DOC_ID
                .Parameters.Add("@File_NO", Data.SqlDbType.VarChar, 50).Value = File_NO
                .Parameters.Add("@Doc_Date", Data.SqlDbType.VarChar, 50).Value = Doc_Date
                .Parameters.Add("@Upload_date", Data.SqlDbType.VarChar, 50).Value = Upload_date
                .Parameters.Add("@Upload_By", Data.SqlDbType.VarChar, 50).Value = Upload_By
                .Parameters.Add("@FILE_NAME", Data.SqlDbType.NVarChar, 50).Value = FILE_NAME
                .Parameters.Add("@Data", Data.SqlDbType.Binary).Value = bytes
                .Parameters.Add("@ContentType", SqlDbType.NVarChar, 50).Value = ContentType
                .Parameters.Add("@Doc_Title", SqlDbType.NVarChar, 50).Value = Doc_Title
                .Parameters.Add("@Licence_No", Data.SqlDbType.VarChar, 50).Value = Licence_No
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function Business_Tracking_1(File_No As String, Business_Type As String, Client_type As String, Proposer_Name As String, Family_code As String, Agent_Id As String, Premium As Double, Card_type As String, Receive_dt As String, Is_Complete As Integer, Forwarded As Integer, Entered_By As String, Business As String, STS As Integer, Benefit As String, is_Branch As Integer, Walk_In_Client As String, Allocated_to As String, Rate_Type As String, Is_IPF As Integer, Pay_Ref_No As String, Paid_Amt As Decimal, ID_NO As String, PIN_NO As String, PAY_MODE As String, County_Code As String, Category As String, CR_12 As String, Sector As String, GI_Category As String, GI_Class As String) As Boolean
            Dim text As String = "rijndael"
            Dim cryptoFactory As DocManagementSecurity.CryptoFactory = New DocManagementSecurity.CryptoFactory()
            Dim crypto As DocManagementSecurity.ICrypto = cryptoFactory.MakeCryptographer(text)
            Dim text2 As String = crypto.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)
            Dim sqlConnection As SqlConnection = New SqlConnection(text2)
            sqlConnection.Open()
            Dim sqlCommand As SqlCommand = New SqlCommand("CRM.dbo.sp_MIS_CRM_Business_Tracking_1", sqlConnection)
            Dim sqlCommand2 As SqlCommand = sqlCommand
            sqlCommand2.CommandType = CommandType.StoredProcedure
            sqlCommand2.Parameters.Add("@File_No", SqlDbType.VarChar, 50).Value = File_No
            sqlCommand2.Parameters.Add("@Business_Type", SqlDbType.VarChar, 50).Value = Business_Type
            sqlCommand2.Parameters.Add("@Client_type", SqlDbType.VarChar, 50).Value = Client_type
            sqlCommand2.Parameters.Add("@Proposer_Name", SqlDbType.VarChar, 150).Value = Proposer_Name
            sqlCommand2.Parameters.Add("@Family_code", SqlDbType.VarChar, 50).Value = Family_code
            sqlCommand2.Parameters.Add("@Agent_Id", SqlDbType.VarChar, 50).Value = Agent_Id
            sqlCommand2.Parameters.Add("@Premium", SqlDbType.[Decimal]).Value = Premium
            sqlCommand2.Parameters.Add("@Receive_dt", SqlDbType.VarChar, 50).Value = Receive_dt
            sqlCommand2.Parameters.Add("@Is_Complete", SqlDbType.Int).Value = Is_Complete
            sqlCommand2.Parameters.Add("@Forwarded", SqlDbType.Int).Value = Forwarded
            sqlCommand2.Parameters.Add("@Entered_By", SqlDbType.VarChar, 50).Value = Entered_By
            sqlCommand2.Parameters.Add("@Business", SqlDbType.VarChar, 50).Value = Business
            sqlCommand2.Parameters.Add("@Benefit", SqlDbType.VarChar, 50).Value = Benefit
            sqlCommand2.Parameters.Add("@STS", SqlDbType.Int).Value = STS
            sqlCommand2.Parameters.Add("@is_Branch", SqlDbType.Int).Value = is_Branch
            sqlCommand2.Parameters.Add("@Walk_In_Client", SqlDbType.VarChar, 5).Value = Walk_In_Client
            sqlCommand2.Parameters.Add("@Allocated_to", SqlDbType.VarChar, 50).Value = Allocated_to
            sqlCommand2.Parameters.Add("@Rate_Type", SqlDbType.VarChar, 50).Value = Rate_Type
            sqlCommand2.Parameters.Add("@Is_IPF", SqlDbType.Int).Value = Is_IPF
            sqlCommand2.Parameters.Add("@Pay_Ref_No", SqlDbType.VarChar, 50).Value = Pay_Ref_No
            sqlCommand2.Parameters.Add("@Paid_Amt", SqlDbType.[Decimal]).Value = Paid_Amt
            sqlCommand2.Parameters.Add("@ID_NO", SqlDbType.VarChar, 50).Value = ID_NO
            sqlCommand2.Parameters.Add("@PIN_NO", SqlDbType.VarChar, 50).Value = PIN_NO
            sqlCommand2.Parameters.Add("@CARD_TYPE", SqlDbType.VarChar, 50).Value = Card_type
            sqlCommand2.Parameters.Add("@PAY_MODE", SqlDbType.VarChar, 50).Value = PAY_MODE
            sqlCommand2.Parameters.Add("@County_Code", SqlDbType.VarChar, 50).Value = County_Code
            sqlCommand2.Parameters.Add("@Category", SqlDbType.VarChar, 50).Value = Category
            sqlCommand2.Parameters.Add("@CR_12", SqlDbType.VarChar, 50).Value = CR_12
            sqlCommand2.Parameters.Add("@Sector", SqlDbType.VarChar, 50).Value = Sector
            sqlCommand2.Parameters.Add("@GI_Category", SqlDbType.VarChar, 50).Value = GI_Category
            sqlCommand2.Parameters.Add("@GI_Class", SqlDbType.VarChar, 50).Value = GI_Class
            sqlCommand2.ExecuteNonQuery()
            sqlConnection.Close()
            Return True
        End Function
        Public Function Business_Tracking(ByVal File_No As String, ByVal Business_Type As String, ByVal Client_type As String, ByVal Proposer_Name As String, ByVal Family_code As String, ByVal Agent_Id As String, ByVal Premium As Double, ByVal Is_Mtiba As Integer, ByVal Receive_dt As String, ByVal Is_Complete As Integer, ByVal Forwarded As Integer, ByVal Entered_By As String, ByVal Business As String, ByVal STS As Integer, ByVal Benefit As String, ByVal is_Branch As String, ByVal Walk_In_Client As String, ByVal Allocated_to As String, ByVal Rate_Type As String, ByVal Is_IPF As Integer, ByVal Pay_Ref_No As String, ByVal Paid_Amt As Decimal) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("CRM.dbo.sp_MIS_CRM_Business_Tracking", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Business_Type", Data.SqlDbType.VarChar, 50).Value = Business_Type
                .Parameters.Add("@Client_type", Data.SqlDbType.VarChar, 50).Value = Client_type
                .Parameters.Add("@Proposer_Name", Data.SqlDbType.VarChar, 150).Value = Proposer_Name
                .Parameters.Add("@Family_code", Data.SqlDbType.VarChar, 50).Value = Family_code
                .Parameters.Add("@Agent_Id", Data.SqlDbType.VarChar, 50).Value = Agent_Id
                .Parameters.Add("@Premium", Data.SqlDbType.Decimal).Value = Premium
                .Parameters.Add("@Is_Mtiba", Data.SqlDbType.Int).Value = Is_Mtiba
                .Parameters.Add("@Receive_dt", Data.SqlDbType.VarChar, 50).Value = Receive_dt
                .Parameters.Add("@Is_Complete", Data.SqlDbType.Int).Value = Is_Complete
                .Parameters.Add("@Forwarded", Data.SqlDbType.Int).Value = Forwarded
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Business", Data.SqlDbType.VarChar, 50).Value = Business
                .Parameters.Add("@Benefit", Data.SqlDbType.VarChar, 50).Value = Benefit
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .Parameters.Add("@is_Branch", Data.SqlDbType.Int).Value = is_Branch
                .Parameters.Add("@Walk_In_Client", Data.SqlDbType.VarChar, 5).Value = Walk_In_Client
                .Parameters.Add("@Allocated_to", Data.SqlDbType.VarChar, 50).Value = Allocated_to
                .Parameters.Add("@Rate_Type", Data.SqlDbType.VarChar, 5).Value = Rate_Type
                .Parameters.Add("@Is_IPF", Data.SqlDbType.Int).Value = Is_IPF
                .Parameters.Add("@Pay_Ref_No", Data.SqlDbType.VarChar, 50).Value = Pay_Ref_No
                .Parameters.Add("@Paid_Amt", Data.SqlDbType.Decimal).Value = Paid_Amt
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function UPLOAD_CLAIMS(ByVal File_No As String, ByVal DOC_CODE As String, ByVal DOC_Title As String, ByVal Entry_Date As String, ByVal Entered_By As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.[sp_claim_Doc_update]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@DOC_CODE", Data.SqlDbType.VarChar, 50).Value = DOC_CODE
                .Parameters.Add("@Doc_Title", Data.SqlDbType.VarChar, 100).Value = DOC_Title
                .Parameters.Add("@Entry_Date", Data.SqlDbType.VarChar, 50).Value = Entry_Date
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By

                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function Register_REIMB(ByVal FILE_NO As String, ByVal RECEIVE_DT As String, ByVal SERVICE_DT As String, ByVal CLAIM_TYPE As String, ByVal MEMBER_NO As String, ByVal MEMBER_NAME As String, _
                                       ByVal INVOICE_NO As String, ByVal INVOICE_AMT As Decimal, ByVal Entered_by As String, ByVal STS As String, ByVal Reason As String, ByVal Proposer As String, ByVal Mobile_no As String, ByVal email As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("CRM.dbo.SP_Register_REIMB_Claim", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@FILE_NO", Data.SqlDbType.VarChar, 150).Value = FILE_NO
                .Parameters.Add("@RECEIVE_DT", Data.SqlDbType.VarChar, 150).Value = RECEIVE_DT

                .Parameters.Add("@SERVICE_DT", Data.SqlDbType.VarChar, 150).Value = SERVICE_DT
                .Parameters.Add("@CLAIM_TYPE", Data.SqlDbType.VarChar, 150).Value = CLAIM_TYPE
                .Parameters.Add("@MEMBER_NO", Data.SqlDbType.VarChar, 150).Value = MEMBER_NO
                .Parameters.Add("@MEMBER_NAME", Data.SqlDbType.VarChar, 150).Value = MEMBER_NAME
                .Parameters.Add("@INVOICE_NO", Data.SqlDbType.VarChar, 150).Value = INVOICE_NO
                .Parameters.Add("@INVOICE_AMT", Data.SqlDbType.Decimal).Value = INVOICE_AMT
                '.Parameters.Add("@COMMENT", Data.SqlDbType.VarChar, 150).Value = COMMENT
                .Parameters.Add("@Entered_by", Data.SqlDbType.VarChar, 150).Value = Entered_by
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 150).Value = Reason
                .Parameters.Add("@Proposer", Data.SqlDbType.VarChar, 150).Value = Proposer
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .Parameters.Add("@Mobile_no", Data.SqlDbType.VarChar, 50).Value = Mobile_no
                .Parameters.Add("@email", Data.SqlDbType.VarChar, 50).Value = email
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function UPLOAD_File_CLAIMS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_Claim_upload", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@DOC_ID", Data.SqlDbType.VarChar, 50).Value = DOC_ID
                .Parameters.Add("@File_NO", Data.SqlDbType.VarChar, 50).Value = File_NO
                .Parameters.Add("@Doc_Date", Data.SqlDbType.VarChar, 50).Value = Doc_Date
                .Parameters.Add("@Upload_date", Data.SqlDbType.VarChar, 50).Value = Upload_date
                .Parameters.Add("@Upload_By", Data.SqlDbType.VarChar, 50).Value = Upload_By
                .Parameters.Add("@FILE_NAME", Data.SqlDbType.NVarChar, 50).Value = FILE_NAME
                .Parameters.Add("@Data", Data.SqlDbType.Binary).Value = bytes
                .Parameters.Add("@ContentType", SqlDbType.NVarChar, 50).Value = ContentType
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function TRACKING_CLAIM_MESSAGES(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("CRM.dbo.SP_TRACKING_CLAIM_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Note", Data.SqlDbType.VarChar, 500).Value = Note
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_TENDER_MESSAGES(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[dbo].[SP_TENDER_MESSAGES]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Note", Data.SqlDbType.VarChar, 500).Value = Note
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_MESSAGES_AGENT_NOTES(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DB_MASTER_AGENTS].dbo.sp_MIS_AGENT_NOTES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Ref_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Note", Data.SqlDbType.VarChar, 500).Value = Note
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function MIS_SALES_COMM_PULL(ByVal Process_by As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("COMMISSION.[dbo].[SP_RUN_COMMISSION]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                '.Parameters.Add("@PREM_DATE_FROM", Data.SqlDbType.Date, 100).Value = Process_by

                '.Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function MIS_SALES_COMM_EXTRACT(ByVal Receipt_no As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("COMMISSION.[dbo].[SP_MIS_SALES_COMMISSIONS_PER_REC]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                '.Parameters.Add("@PREM_DATE_FROM", Data.SqlDbType.Date, 100).Value = Process_by

                .Parameters.Add("@Rec_no", Data.SqlDbType.VarChar, 50).Value = Receipt_no
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function MIS_SALES_COMM_RUN(ByVal Process_by As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("COMMISSION.[dbo].[SP_RUN_COMMISSION]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                '.Parameters.Add("@PREM_DATE_FROM", Data.SqlDbType.Date, 100).Value = Process_by

                '.Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function TRACKING_MESSAGES_ETIMS(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("COMMISSION.dbo.[SP_COMMISSION_MESSAGES_ETIMS]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Ref_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Notes", Data.SqlDbType.NText, 1000).Value = Note
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_MESSAGES(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("COMMISSION.dbo.[SP_COMMISSION_MESSAGES]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Rec_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Notes", Data.SqlDbType.NText, 1000).Value = Note
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_MESSAGES_SALES(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("CRM.dbo.SP_TRACKING_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Note", Data.SqlDbType.VarChar, 500).Value = Note
                .ExecuteNonQuery()
            End With

            myConnection.Close()

            Return myID

        End Function
        Public Function UPLOAD_File_ETIMS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("Doc_Arc_DB.dbo.sp_FILE_Doc_ETIMS", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@DOC_ID", Data.SqlDbType.NVarChar, 50).Value = DOC_ID
                .Parameters.Add("@Ref_No", Data.SqlDbType.VarChar, 50).Value = File_NO
                .Parameters.Add("@Doc_Date", Data.SqlDbType.VarChar, 50).Value = Doc_Date
                .Parameters.Add("@Upload_date", Data.SqlDbType.VarChar, 50).Value = Upload_date
                .Parameters.Add("@Upload_By", Data.SqlDbType.VarChar, 50).Value = Upload_By
                .Parameters.Add("@FILE_NAME", Data.SqlDbType.NVarChar, 50).Value = FILE_NAME
                .Parameters.Add("@Data", Data.SqlDbType.Binary).Value = bytes
                .Parameters.Add("@ContentType", SqlDbType.NVarChar, 50).Value = ContentType
                .Parameters.Add("@Doc_Title", SqlDbType.NVarChar, 50).Value = Doc_Title

                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function UPLOAD_ITEMS_1(File_No As String, DOC_CODE As String, DOC_Title As String, Entry_Date As String, Entered_By As String, bytes As Byte(), FILE_NAME As String, ContentType As String) As Integer
            Dim num As Double = 0.0
            Dim text As String = "rijndael"
            Dim cryptoFactory As DocManagementSecurity.CryptoFactory = New DocManagementSecurity.CryptoFactory()
            Dim crypto As DocManagementSecurity.ICrypto = cryptoFactory.MakeCryptographer(text)
            Dim text2 As String = crypto.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)
            Dim sqlConnection As SqlConnection = New SqlConnection(text2)
            sqlConnection.Open()
            Dim sqlCommand As SqlCommand = New SqlCommand("[Doc_Arc_DB].dbo.[sp_FILE_Doc_update_1]", sqlConnection)
            Dim sqlCommand2 As SqlCommand = sqlCommand
            sqlCommand2.CommandType = CommandType.StoredProcedure
            sqlCommand2.Parameters.Add("@File_No", SqlDbType.VarChar, 50).Value = File_No
            sqlCommand2.Parameters.Add("@DOC_CODE", SqlDbType.VarChar, 50).Value = DOC_CODE
            sqlCommand2.Parameters.Add("@Doc_Title", SqlDbType.VarChar, 100).Value = DOC_Title
            sqlCommand2.Parameters.Add("@Entry_Date", SqlDbType.VarChar, 50).Value = Entry_Date
            sqlCommand2.Parameters.Add("@Entered_By", SqlDbType.VarChar, 50).Value = Entered_By
            sqlCommand2.Parameters.Add("@FILE_NAME", SqlDbType.NVarChar, 50).Value = FILE_NAME
            sqlCommand2.Parameters.Add("@Data", SqlDbType.Binary).Value = bytes
            sqlCommand2.Parameters.Add("@ContentType", SqlDbType.NVarChar, 50).Value = ContentType
            sqlCommand2.ExecuteNonQuery()
            sqlConnection.Close()
            Return CInt(Math.Round(num))
        End Function
        Public Function UPLOAD_File_DOCS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("Doc_Arc_DB.dbo.sp_File_DOC_upload", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@DOC_ID", Data.SqlDbType.Int).Value = DOC_ID
                .Parameters.Add("@File_NO", Data.SqlDbType.VarChar, 50).Value = File_NO
                .Parameters.Add("@Doc_Date", Data.SqlDbType.VarChar, 50).Value = Doc_Date
                .Parameters.Add("@Upload_date", Data.SqlDbType.VarChar, 50).Value = Upload_date
                .Parameters.Add("@Upload_By", Data.SqlDbType.VarChar, 50).Value = Upload_By
                .Parameters.Add("@FILE_NAME", Data.SqlDbType.NVarChar, 50).Value = FILE_NAME
                .Parameters.Add("@Data", Data.SqlDbType.Binary).Value = bytes
                .Parameters.Add("@ContentType", SqlDbType.NVarChar, 50).Value = ContentType
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function ComputePremiums(ByVal Quote_No As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[sp_Add_Compute_Premiums]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Quote_No", Data.SqlDbType.NVarChar).Value = Quote_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function ENROLL_AGENT(ByVal AGENT_CODE As String, ByVal USER_ID As String, ByVal AGENT_NAME As String, ByVal AGENT_TYPE As String, ByVal UNIT_CODE As String,
        ByVal BRANCH_CODE As String, ByVal REGION_CODE As String, ByVal COMMISSION As Decimal, ByVal INCENTIVE_NEW As Decimal, ByVal INCENTIVE_RENEW As Decimal, ByVal COMMISSION_NONMED As Decimal,
        ByVal COMMISSION_MARINE As Decimal, ByVal EMAIL As String, ByVal HRMIS_CODE As String, ByVal AIK_CODE As String, ByVal REG As Integer, ByVal Terminated As Integer, ByVal Terminate_Date As String,
        ByVal UPDATED_BY As String, ByVal VOUCHER_CODE As String, ByVal TITLE As String, ByVal Business As String, ByVal MOBILE_NO As String, ByVal Director1 As String, ByVal Contracted As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[COMMISSION].[dbo].SP_ENROLL_AGENT", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@AGENT_CODE", Data.SqlDbType.VarChar, 150).Value = AGENT_CODE
                .Parameters.Add("@USER_ID", Data.SqlDbType.VarChar, 150).Value = USER_ID
                .Parameters.Add("@AGENT_NAME", Data.SqlDbType.VarChar, 200).Value = AGENT_NAME
                .Parameters.Add("@AGENT_TYPE", Data.SqlDbType.VarChar, 150).Value = AGENT_TYPE
                .Parameters.Add("@UNIT_CODE", Data.SqlDbType.VarChar, 150).Value = UNIT_CODE
                .Parameters.Add("@BRANCH_CODE", Data.SqlDbType.VarChar, 50).Value = BRANCH_CODE
                .Parameters.Add("@REGION_CODE", Data.SqlDbType.VarChar, 50).Value = REGION_CODE
                .Parameters.Add("@COMMISSION", Data.SqlDbType.Decimal).Value = COMMISSION
                .Parameters.Add("@INCENTIVE_NEW", Data.SqlDbType.Decimal).Value = INCENTIVE_NEW
                .Parameters.Add("@INCENTIVE_RENEW", Data.SqlDbType.Decimal).Value = INCENTIVE_RENEW
                .Parameters.Add("@COMMISSION_NONMED", Data.SqlDbType.Decimal).Value = COMMISSION_NONMED
                .Parameters.Add("@COMMISSION_MARINE", Data.SqlDbType.Decimal).Value = COMMISSION_MARINE
                .Parameters.Add("@EMAIL", Data.SqlDbType.VarChar, 50).Value = EMAIL
                .Parameters.Add("@HRMIS_CODE", Data.SqlDbType.VarChar, 50).Value = HRMIS_CODE
                .Parameters.Add("@AIK_CODE", Data.SqlDbType.VarChar, 50).Value = AIK_CODE
                .Parameters.Add("@REGISTERED", Data.SqlDbType.Int).Value = REG
                .Parameters.Add("@ACTIVE", Data.SqlDbType.Int).Value = 1
                .Parameters.Add("@Terminated", Data.SqlDbType.Int).Value = Terminated
                .Parameters.Add("@Terminate_Date", Data.SqlDbType.VarChar, 50).Value = Terminate_Date
                .Parameters.Add("@UPDATED_BY", Data.SqlDbType.VarChar, 50).Value = UPDATED_BY
                .Parameters.Add("@VOUCHER_CODE", Data.SqlDbType.VarChar, 50).Value = VOUCHER_CODE
                .Parameters.Add("@TITLE", Data.SqlDbType.VarChar, 50).Value = TITLE
                .Parameters.Add("@Business", Data.SqlDbType.VarChar, 50).Value = Business
                .Parameters.Add("@MOBILE_NO", Data.SqlDbType.VarChar, 50).Value = MOBILE_NO

                .Parameters.Add("@Director1", Data.SqlDbType.VarChar, 200).Value = Director1
                .Parameters.Add("@Contract_Signed", Data.SqlDbType.VarChar, 20).Value = Contracted
                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function MIS_SALES_RETAINER_GI(Rec_dateFrom As DateTime, Rec_dateTo As DateTime) As Boolean
            Dim text As String = "rijndael"
            Dim cryptoFactory As DocManagementSecurity.CryptoFactory = New DocManagementSecurity.CryptoFactory()
            Dim crypto As DocManagementSecurity.ICrypto = cryptoFactory.MakeCryptographer(text)
            Dim text2 As String = crypto.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)
            Dim sqlConnection As SqlConnection = New SqlConnection(text2)
            sqlConnection.Open()
            Dim sqlCommand As SqlCommand = New SqlCommand("[COMMISSION].[dbo].[SP_MIS_GI_UPLOAD_FILE_GI]", sqlConnection) With {.CommandTimeout = 0}
            sqlCommand.CommandType = CommandType.StoredProcedure
            sqlCommand.ExecuteNonQuery()
            sqlConnection.Close()
            Return True
        End Function
        Public Function MIS_SALES_AGEN_EXTRACT(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("COMMISSION").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[COMMISSION].dbo.[MIS_SALES_AGEN_EXTRACT]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@PREM_DATE_FROM", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@PREM_DATE_TO", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                '.Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function ADD_PROPOSER_DET(ByVal Policy_Type As String, ByVal Quote_date As String, ByVal Policy_Period As String, ByVal Agent_ID As String, ByVal Prefix As String, ByVal First_Name As String, ByVal Last_Name As String, ByVal Mobile_No As String, ByVal Email As String, ByVal Address As String, ByVal ID_No As String, _
                                            ByVal Town_Code As String, ByVal Town As String, ByVal Quote_No As String, _
                                            ByVal Version As String, ByVal Quote_Status As String, ByVal Family_Size As Integer, ByVal STS As Integer) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Add_Member_Contract", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Policy_Type", Data.SqlDbType.VarChar, 50).Value = Policy_Type
                .Parameters.Add("@Quote_date", Data.SqlDbType.VarChar, 50).Value = Quote_date
                .Parameters.Add("@Policy_Period", Data.SqlDbType.VarChar, 50).Value = Policy_Period
                .Parameters.Add("@Agent_ID", Data.SqlDbType.VarChar, 50).Value = Agent_ID
                .Parameters.Add("@Prefix", Data.SqlDbType.VarChar, 50).Value = Prefix
                .Parameters.Add("@First_Name", Data.SqlDbType.VarChar, 150).Value = First_Name
                .Parameters.Add("@Last_Name", Data.SqlDbType.VarChar, 150).Value = Last_Name
                .Parameters.Add("@Mobile_No", Data.SqlDbType.VarChar, 50).Value = Mobile_No
                .Parameters.Add("@Email", Data.SqlDbType.VarChar, 50).Value = Email
                .Parameters.Add("@Address", Data.SqlDbType.VarChar, 150).Value = Address
                .Parameters.Add("@ID_No", Data.SqlDbType.VarChar, 150).Value = ID_No
                .Parameters.Add("@Town_Code", Data.SqlDbType.VarChar, 50).Value = Town_Code
                .Parameters.Add("@Town", Data.SqlDbType.VarChar, 50).Value = Town
                .Parameters.Add("@Quote_No", Data.SqlDbType.VarChar, 50).Value = Quote_No
                .Parameters.Add("@Version", Data.SqlDbType.VarChar, 50).Value = Version
                .Parameters.Add("@Quote_Status", Data.SqlDbType.VarChar, 50).Value = Quote_Status
                .Parameters.Add("@Family_Size", Data.SqlDbType.Int).Value = Family_Size
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS

                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function Update_cutoff(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[COMMISSION].[dbo].[SP_COMMISSION_CUTOFF_DATE]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@DATE_FROM", Data.SqlDbType.Date, 50).Value = Rec_dateFrom
                .Parameters.Add("@DATE_TO", Data.SqlDbType.Date, 50).Value = Rec_dateTo
                '.Parameters.Add("@name", Data.SqlDbType.VarChar, 50).Value = name
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function Runcommission_hr(ByVal Rec_dateFrom As Date, ByVal name As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[COMMISSION].[dbo].[SP_COMMISSION_PAY_HR]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@Rec_dateFrom", Data.SqlDbType.Date, 50).Value = Rec_dateFrom
                '.Parameters.Add("@name", Data.SqlDbType.VarChar, 50).Value = name
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function Process_Commission(ByVal AGENT As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[COMMISSION].[dbo].[SP_COMMISSION_UPLOAD_FILE_SA_DY_AGENT]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@Rec_dateFrom", Data.SqlDbType.Date, 50).Value = Rec_dateFrom
                .Parameters.Add("@USER_ID", Data.SqlDbType.VarChar, 50).Value = AGENT
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function Process_Commission_1(ByVal Rec_dateFrom As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[COMMISSION].[dbo].[SP_RUN_COMMISSION]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@Rec_dateFrom", Data.SqlDbType.Date, 50).Value = Rec_dateFrom
                '.Parameters.Add("@USER_ID", Data.SqlDbType.VarChar, 50).Value = AGENT
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function CLOSE_MONTH_N_DEBITS(ByVal Rec_dateFrom As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[COMMISSION].[dbo].[SP_COMMISSIONS_MONTH_CLOSE_N_BALANCES]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                '.Parameters.Add("@Rec_dateFrom", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                '.Parameters.Add("@Rec_dateTo", Data.SqlDbType.Date, 200).Value = Rec_dateFrom

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function MIS_SALES_UPLOAD_FILE_INC(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[COMMISSION].[dbo].[SP_MIS_SALES_INC_MASTER_INC_UPLOAD]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@PERIOD_FROM", Data.SqlDbType.Date).Value = Rec_dateFrom
                .Parameters.Add("@PERIOD_TO", Data.SqlDbType.Date).Value = Rec_dateTo

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function MIS_SALES_UPLOAD_FILE(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[COMMISSION].[dbo].[SP_COMMISSION_UPLOAD_FILE_SA_DY]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                '.Parameters.Add("@Rec_dateFrom", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                '.Parameters.Add("@Rec_dateTo", Data.SqlDbType.Date, 200).Value = Rec_dateTo

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function ADD_MEMBER_QUOTE(ByVal Quote_No As String, ByVal First_name As String, ByVal Last_Name As String, ByVal DOB As String, ByVal Age As Integer, ByVal Age_Group As String, ByVal Gender As String, _
      ByVal Relation As String, ByVal Plan_Name As String, ByVal IP_Limit As Decimal, ByVal IP_Premiums As Decimal, ByVal OP_Limit As Decimal, ByVal OP_Premiums As Decimal, _
      ByVal PA_PTD_Limit As Decimal, ByVal PA_PTD_Premium As Decimal) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("SALES").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Add_Member_Premiums", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Quote_No", Data.SqlDbType.VarChar, 50).Value = Quote_No
                .Parameters.Add("@First_name", Data.SqlDbType.VarChar, 150).Value = First_name
                .Parameters.Add("@Last_Name", Data.SqlDbType.VarChar, 150).Value = Last_Name
                .Parameters.Add("@DOB", Data.SqlDbType.VarChar, 50).Value = DOB
                .Parameters.Add("@Age", Data.SqlDbType.Int).Value = Age
                .Parameters.Add("@Age_Group", Data.SqlDbType.VarChar, 150).Value = Age_Group
                .Parameters.Add("@Gender", Data.SqlDbType.VarChar, 50).Value = Gender
                .Parameters.Add("@Relation", Data.SqlDbType.VarChar, 50).Value = Relation
                .Parameters.Add("@Plan_Name", Data.SqlDbType.VarChar, 50).Value = Plan_Name
                .Parameters.Add("@IP_Limit", Data.SqlDbType.Decimal).Value = IP_Limit
                .Parameters.Add("@IP_Premiums", Data.SqlDbType.Decimal).Value = IP_Premiums
                .Parameters.Add("@OP_Limit", Data.SqlDbType.Decimal).Value = OP_Limit
                .Parameters.Add("@OP_Premiums", Data.SqlDbType.Decimal).Value = OP_Premiums
                .Parameters.Add("@PA_PTD_Limit", Data.SqlDbType.Decimal).Value = PA_PTD_Limit
                .Parameters.Add("@PA_PTD_Premium", Data.SqlDbType.Decimal).Value = PA_PTD_Premium

                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID


        End Function

#End Region
#Region "3. Other Functions"
        '=============================FILL GRID SP=============================
        Public Function LoadCombo(ByVal MyTable As String, ByVal MyText As String, ByVal MyValue As String) As DataTable
            Try
                Dim MyDatatable As DataTable : Dim Str As String

                Str = "SELECT " & MyText & "," & MyValue & " FROM " & MyTable
                MyDatatable = TryCast(DBAction(Str, DBActionType.DataTable), DataTable)

                LoadCombo = MyDatatable

                Return LoadCombo
            Catch ex As Exception
                LoadCombo = Nothing
                Return LoadCombo
            End Try
        End Function

        Public Sub DoLogs(ByVal Type1 As String)
            Dim fp As StreamWriter
            Dim FileName As String = AppDomain.CurrentDomain.BaseDirectory & "\ErrorLogs\Error_Logs.txt"
            REM check if the file name already exists and if not , create a new file name
            If File.Exists(FileName) = False Then
                fp = File.CreateText(FileName)
                fp.Flush()
                fp.Close()
            End If
            REM Go ahead and write these file Logs

            Dim fs As FileStream = New FileStream(FileName, FileMode.OpenOrCreate, FileAccess.Write)
            Dim m_streamWriter As StreamWriter = New StreamWriter(fs)
            m_streamWriter.BaseStream.Seek(0, SeekOrigin.End)
            m_streamWriter.WriteLine(Type1 & " : at : " & Now)
            m_streamWriter.Flush()
            m_streamWriter.Close()


        End Sub

        Public Function CANADD(ByVal ProfID As String, ByVal MyPage As String) As Boolean
            Try
                Dim Str As String : Dim Mytable As DataTable

                MyPage = "~/" & MyPage

                Str = "Select * from Menuaccess where ProfileID='" & ProfID & "' and pageUrl='" & MyPage & "'"
                Mytable = TryCast(DBAction(Str, DBActionType.DataTable), DataTable)
                If Mytable.Rows.Count > 0 Then
                    If Mytable.Rows(0).Item("CanAdd") = True Then
                        Return True
                    Else
                        Return False
                    End If
                Else
                    Return False
                End If
                Mytable.Dispose()
                Mytable = Nothing
            Catch ex As Exception
                DoLogs("Error in:-> Public Function CanAddNew() : " & ex.Message.ToString)
                Return False
            End Try
        End Function
        Public Function CANEDIT(ByVal ProfID As String, ByVal MyPage As String) As Boolean
            Try
                Dim Str As String : Dim Mytable As DataTable

                MyPage = "~/" & MyPage

                Str = "Select * from Menuaccess where ProfileID='" & ProfID & "' and pageUrl='" & MyPage & "'"
                Mytable = TryCast(DBAction(Str, DBActionType.DataTable), DataTable)
                If Mytable.Rows.Count > 0 Then
                    If Mytable.Rows(0).Item("CanEdit") = True Then
                        Return True
                    Else
                        Return False
                    End If
                Else
                    Return False
                End If
                Mytable.Dispose()
                Mytable = Nothing
            Catch ex As Exception
                DoLogs("Error in:-> Public Function CANEDIT() : " & ex.Message.ToString)
                Return False
            End Try
        End Function
        Public Function CANDELETE(ByVal ProfID As String, ByVal MyPage As String) As Boolean
            Try
                Dim Str As String : Dim Mytable As DataTable

                MyPage = "~/" & MyPage

                Str = "Select * from Menuaccess where ProfileID='" & ProfID & "' and pageUrl='" & MyPage & "'"
                Mytable = TryCast(DBAction(Str, DBActionType.DataTable), DataTable)
                If Mytable.Rows.Count > 0 Then
                    If Mytable.Rows(0).Item("CanDelete") = True Then
                        Return True
                    Else
                        Return False
                    End If
                Else
                    Return False
                End If
                Mytable.Dispose()
                Mytable = Nothing
            Catch ex As Exception
                DoLogs("Error in:-> Public Function CANDELETE() : " & ex.Message.ToString)
                Return False
            End Try
        End Function
        Public Function CANREADONLY(ByVal ProfID As String, ByVal MyPage As String) As Boolean
            Try
                Dim Str As String : Dim Mytable As DataTable

                MyPage = "~/" & MyPage

                Str = "Select * from Menuaccess where ProfileID='" & ProfID & "' and pageUrl='" & MyPage & "'"
                Mytable = TryCast(DBAction(Str, DBActionType.DataTable), DataTable)
                If Mytable.Rows.Count > 0 Then
                    If Mytable.Rows(0).Item("ReadOnly") = True Then
                        Return True
                    Else
                        Return False
                    End If
                Else
                    Return False
                End If
                Mytable.Dispose()
                Mytable = Nothing
            Catch ex As Exception
                DoLogs("Error in:-> Public Function CANREADONLY() : " & ex.Message.ToString)
                Return False
            End Try
        End Function



#End Region
#Region "4. Formats"
        Public Function Formatmoney(ByVal strValue As String) As String
            Dim Str As String = ""

            If IsNumeric(strValue) Then
                Str = CDec(strValue).ToString("n")
            Else
                strValue = 0
                Str = CDec(strValue).ToString("n")
            End If

            Return Str
        End Function
        Public Function GetSqlDate(ByVal dateval As Date) As String
            Dim Datestr As String
            Datestr = dateval.Year & "-" & dateval.Month & "-" & dateval.Day
            GetSqlDate = Datestr
        End Function
        Public Function GetSqlDateTime(ByVal dateval As Date) As String
            '-------------------------------
            'Addition by pkamoche
            Dim TmpDate As Date = Now()
            Dim Datestr As String
            Datestr = dateval.Year & "-" & dateval.Month & "-" & dateval.Day & " " & TmpDate.Hour & ":" & TmpDate.Minute & ":" & TmpDate.Second
            GetSqlDateTime = Datestr
        End Function
        Public Function FormatDisplayDate(ByVal Pdate As String) As String
            Dim StatusDate As String = Nothing
            Dim IfNullPdate As String = Nothing
            Dim Pattern As String = "dd-MMM-yyyy"
            'Dim parsedDate As Date
            If IsDate(Pdate) Then
                StatusDate = Format(Pdate, "dd-MMM-yyyy")
                Return StatusDate
            Else
                IfNullPdate = Pdate
                Return IfNullPdate
            End If

        End Function
        Public Function Convert_ToCRB_Date(ByVal MyDate As String) As String
            'Dim I As Integer
            If MyDate.Trim <> "" Then
                Dim MyDateValue As Date
                Try
                    If IsDate(MyDate) Then
                        MyDateValue = Date.Parse(MyDate)
                        MyDate = Format(MyDateValue, "yyyyMMdd")
                        Return MyDate
                    Else
                        Return ""
                    End If
                Catch ex As Exception
                    Return ""
                End Try

            End If
            Return MyDate
        End Function
        Function FormatDate(ByVal DateValue As String) As String
            Try
                Dim strYYYY As String
                Dim strMM As String
                Dim strDD As String
                Dim MyDate As String

                If DateValue = "" Then
                    Return Nothing
                End If

                Dim NewCultureInfo As CultureInfo
                NewCultureInfo = System.Threading.Thread.CurrentThread.CurrentCulture.Clone
                NewCultureInfo.DateTimeFormat.ShortDatePattern = "dd-MMM-yyyy"
                NewCultureInfo.DateTimeFormat.DateSeparator = "-"
                Thread.CurrentThread.CurrentCulture = NewCultureInfo

                If IsDate(DateValue) Then
                    Dim MyDateValue As Date
                    Try
                        MyDateValue = Date.Parse(DateValue)
                        MyDate = Format(MyDateValue, "dd-MMM-yyyy")
                    Catch ex As Exception
                        Return Nothing
                    End Try
                    Return MyDate
                Else
                    If DateValue <> "00000000" Then
                        strYYYY = Left(DateValue, 4)
                        strMM = DateValue.Substring(4, 2)

                        strDD = Right(DateValue, 2)
                        'strYYYY = CStr(DatePart("yyyy", DateValue))
                        'strMM = CStr(DatePart("m", DateValue))
                        If Len(strMM) = 1 Then strMM = "0" & strMM

                        'strDD = CStr(DatePart("d", DateValue))
                        If Len(strDD) = 1 Then strDD = "0" & strDD
                        MyDate = strDD & "/" & strMM & "/" & strYYYY
                        If IsDate(MyDate) Then
                            Dim MyDateValue As Date
                            Try
                                MyDateValue = Date.Parse(MyDate)
                                MyDate = Format(MyDateValue, "dd-MMM-yyyy")
                            Catch ex As Exception
                                Return Nothing
                            End Try
                        End If
                        Return MyDate
                    Else
                        Return Nothing
                    End If
                End If


            Catch ex As Exception
                Return Nothing
            End Try

        End Function
#End Region
    End Class
    Public Class DataCleanUp
        Public Sub ClearControls(ByVal MyContainer As Object, Optional ByVal MyContainer2 As Object = Nothing)
            Try

                Dim MyControl As New Control
                Dim MyControl1 As New Control
                Dim Mycontrol2 As New Control
                Dim MyTextBox As New TextBox
                Dim MyDropdownlist As New DropDownList
                Dim MyPanel As New Panel
                Dim MyLabel As New Label
                Dim MyHiddenField As New HiddenField

                Dim MyLstList As New ListBox

                Dim MyView As New View
                Dim MyMultiview As New MultiView
                MyMultiview = TryCast(MyContainer, MultiView)

                If MyContainer2 IsNot Nothing Then
                    MyView = TryCast(MyContainer2, View)
                    For Each MyControl In MyView.Controls
                        MyTextBox = TryCast(MyControl, TextBox)
                        If MyTextBox IsNot Nothing Then
                            MyTextBox.Text = ""
                        End If

                        MyDropdownlist = TryCast(MyControl, DropDownList)
                        If MyDropdownlist IsNot Nothing Then
                            MyDropdownlist.SelectedValue = ""
                        End If

                        MyLstList = TryCast(MyControl, ListBox)
                        If MyLstList IsNot Nothing Then
                            MyLstList.Items.Clear()
                        End If

                        MyHiddenField = TryCast(MyControl, HiddenField)
                        If MyHiddenField IsNot Nothing Then
                            MyHiddenField.Value = ""
                        End If
                    Next
                Else

                    If MyMultiview IsNot Nothing Then
                        For Each MyView In MyMultiview.Views
                            For Each MyControl In MyView.Controls
                                MyTextBox = TryCast(MyControl, TextBox)
                                If MyTextBox IsNot Nothing Then
                                    MyTextBox.Text = ""

                                End If

                                MyLabel = TryCast(MyControl, Label)
                                If MyLabel IsNot Nothing Then
                                    MyLabel.Text = ""
                                End If

                                MyDropdownlist = TryCast(MyControl, DropDownList)
                                If MyDropdownlist IsNot Nothing Then
                                    MyDropdownlist.SelectedValue = ""
                                End If

                                MyHiddenField = TryCast(MyControl, HiddenField)
                                If MyHiddenField IsNot Nothing Then
                                    MyHiddenField.Value = ""
                                End If

                                MyPanel = TryCast(MyControl, Panel)
                                If MyPanel IsNot Nothing Then
                                    For Each Mycontrol2 In MyPanel.Controls
                                        MyLstList = TryCast(Mycontrol2, ListBox)
                                        If MyLstList IsNot Nothing Then
                                            MyLstList.Items.Clear()
                                        End If

                                        MyLabel = TryCast(Mycontrol2, Label)
                                        If MyLabel IsNot Nothing Then
                                            MyLabel.Text = ""
                                        End If
                                    Next


                                End If
                            Next
                        Next
                    End If

                End If
            Catch ex As Exception
                Dim MyDbAction As New DataManagement
                MyDbAction.DoLogs("Class==DocManager.vb : Private Sub DBAction" & " : Error : " & ex.Message)

            End Try



        End Sub
    End Class
    Public Class ResponseHelper

        Public Sub New()

        End Sub

        'SELECT  [ACTIVITY_ID],[CORPORATE_NAME],[POLICY_CODE],[ACTIVITY_NAME],[ACT_DATE],[ACT_PERIOD],[ACT_MINUTES]  FROM [SALES].[dbo].[VW_RETENTION_ACTIVITY]

        Public Shared Sub Redirect(ByVal url As String, ByVal target As String, ByVal windowFeatures As String)

            Dim context As HttpContext = HttpContext.Current

            If (String.IsNullOrEmpty(target) OrElse target.Equals("_self", StringComparison.OrdinalIgnoreCase)) AndAlso String.IsNullOrEmpty(windowFeatures) Then

                context.Response.Redirect(url)

            Else

                Dim page As Page = CType(context.Handler, Page)

                If page Is Nothing Then

                    Throw New InvalidOperationException("Cannot redirect to new window outside Page context.")

                End If

                url = page.ResolveClientUrl(url)

                Dim script As String

                If (Not String.IsNullOrEmpty(windowFeatures)) Then

                    script = "window.open(""{0}"", ""{1}"", ""{2}"");"

                Else

                    script = "window.open(""{0}"", ""{1}"");"

                End If

                script = String.Format(script, url, target, windowFeatures)

                ScriptManager.RegisterStartupScript(page, GetType(Page), "Redirect", script, True)

            End If

        End Sub
        Public Shared Sub AddDeleteConfirmation(ByVal e As GridViewRowEventArgs, ByVal LinkButtonName As String)
           
            Dim MyLinkbutton As New LinkButton

            If e.Row.RowType = DataControlRowType.DataRow Then
                MyLinkbutton = TryCast(e.Row.FindControl(LinkButtonName), LinkButton)
                If Not IsNothing(MyLinkbutton) Then
                    MyLinkbutton.Attributes.Add("onclick", _
                                                           "return confirm(""Are you sure you wish to delete this record?"")")
                End If

            End If
        End Sub


    End Class
End Namespace


