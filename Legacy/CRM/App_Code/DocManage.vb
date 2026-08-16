Imports System
Imports System.Data
Imports System.Data.Odbc
Imports System.Data.OracleClient
Imports System.Data.SqlClient
Imports System.Diagnostics
Imports System.Globalization
Imports System.IO
Imports System.Net
Imports System.Net.Mail
Imports System.Runtime.Caching
Imports System.Security.Authentication
Imports System.Security.Cryptography
Imports System.Text
Imports System.Threading
Imports System.Web.Configuration
Imports DocManage
Imports Microsoft
Imports Microsoft.Practices.EnterpriseLibrary.PolicyInjection.Configuration.Design
Imports Microsoft.Practices.EnterpriseLibrary.Security.Cryptography
Imports Microsoft.VisualBasic


Namespace DocManage
    Public Class Emailing
        Dim MyDBAction As New DataManagement

        Public Function SendNotification2(ByVal path As String, ByVal mysubj As String, ByVal strMsgBody As String, ByVal SendAsHTML As Boolean,
        ByVal EmailServer As String, ByVal EmailUsername As String, ByVal EmailPassword As String,
        Optional ByVal strSendtoEmail As String = "", Optional ByVal strSendToName As String = "", Optional ByVal strMailFromEmail As String = "",
        Optional ByVal strMailFromName As String = "") As Boolean
            Dim oMsg = New MailMessage()
            Dim MessageSentOK As Boolean = False

            Try
                ''create the mail message

                'Dim mail As New MailMessage()

                ''set the addresses


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

        Public Function SendNotification(ByVal path As String, ByVal mysubj As String, ByVal strMsgBody As String, ByVal SendAsHTML As Boolean,
        ByVal EmailServer As String, ByVal EmailUsername As String, ByVal EmailPassword As String,
        Optional ByVal strSendtoEmail As String = "", Optional ByVal strSendToName As String = "", Optional ByVal strMailFromEmail As String = "",
        Optional ByVal strMailFromName As String = "", Optional ByVal cc_email As String = "") As Boolean

            Dim MessageSentOK As Boolean = False
            Dim oMsg = New MailMessage()
            Dim strHTML As String = ""
            Dim msg As MailMessage = New MailMessage()

            Try


                'strSendtoEmail = "jmwaniki@aar.co.ke"
                'cc_email = "jmwaniki@aar.co.ke"

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

                If path <> "" Then
                    'Dim attachment_ As System.Net.Mail.Attachment
                    'attachment_ = New System.Net.Mail.Attachment(path)
                    'oMsg.Attachments.Add(attachment_)
                    For Each filePath As String In Directory.GetFiles(path)
                        Dim Attach As New Net.Mail.Attachment(filePath)
                        oMsg.Attachments.Add(Attach)
                    Next
                End If

                'SmtpServer.UseDefaultCredentials = False
                'SmtpServer.Credentials = New System.Net.NetworkCredential(EmailUsername, EmailPassword)
                'SmtpServer.Port = 587
                'SmtpServer.DeliveryMethod = SmtpDeliveryMethod.Network
                'SmtpServer.EnableSsl = True
                'SmtpServer.TargetName = "STARTTLS/smtp.office365.com"
                ''smtp.SSLConfiguration.EnabledSslProtocols = SslProtocols.Tls12
                ''ServicePointManager.SecurityProtocol = SecurityProtocolType.Ssl3
                'SmtpServer.Send(oMsg)
                'MessageSentOK = True
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
                'pepea 
                'SmtpServer.DeliveryMethod = SmtpDeliveryMethod.Network
                'SmtpServer.Port = 2525
                'SmtpServer.UseDefaultCredentials = False
                'SmtpServer.Credentials = New System.Net.NetworkCredential(EmailUsername, EmailPassword)
                ''SmtpServer.EnableSsl = True
                'SmtpServer.EnableSsl = False
                'SmtpServer.Send(oMsg)
                'MessageSentOK = True

            Catch ex As Exception



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
        Public Function EncryptOrDecryptFile(ByVal strInputFile As String,
                                             ByVal strOutputFile As String,
                                             ByVal bytKey() As Byte,
                                             ByVal bytIV() As Byte,
                                             ByVal Direction As CryptoAction) As String
            Try 'In case of errors.

                'Setup file streams to handle input and output. D:\PROJECTS\SOURCES
                fsInput = New System.IO.FileStream(strInputFile, FileMode.Open,
                                                   FileAccess.Read)
                fsOutput = New System.IO.FileStream(strOutputFile, FileMode.OpenOrCreate,
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
                        csCryptoStream = New CryptoStream(fsOutput,
                        cspRijndael.CreateEncryptor(bytKey, bytIV),
                        CryptoStreamMode.Write)

                    Case CryptoAction.ActionDecrypt
                        csCryptoStream = New CryptoStream(fsOutput,
                        cspRijndael.CreateDecryptor(bytKey, bytIV),
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
                    EncryptOrDecryptFile = "Encryption Complete" + Wrap + Wrap +
                         "Total bytes processed = " +
                          lngBytesProcessed.ToString
                Else
                    'Update the user when the file is done.
                    EncryptOrDecryptFile = "Decryption Complete" + Wrap + Wrap +
                           "Total bytes processed = " +
                            lngBytesProcessed.ToString
                End If

                fsOutput = Nothing
                fsInput = Nothing

                Return EncryptOrDecryptFile
                'Catch file not found error.
            Catch When Err.Number = 53 'if file not found
                EncryptOrDecryptFile = "Invalid Path or Filename,Please check to make sure the path and filename" +
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
                    EncryptOrDecryptFile = "Invalid Password : Please check to make sure that you entered the correct" +
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
            Private _key() As Byte = {132, 42, 53, 124, 75, 56, 87, 38, 9, 10, 161, 132, 183,
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
                MyConnectstring = "CRM"
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

                    Dim myODBCConnection As New OdbcConnection(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
                    myODBCConnection.Open()


                    Dim myCommand As New OdbcCommand(MyDBAction.ToString, myODBCConnection)
                    Dim MyReader As OdbcDataReader = myCommand.ExecuteReader(Data.CommandBehavior.CloseConnection)

                    Return MyReader
                Case 9
                    myConnection.Close()

                    Dim myODBCConnection As New OdbcConnection(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
                    myODBCConnection.Open()

                    Dim myCommand As New OdbcCommand(MyDBAction.ToString, myODBCConnection)
                    Dim ScalarItem As Object = myCommand.ExecuteScalar

                    myODBCConnection.Close()

                    Return ScalarItem

                Case 10
                    myConnection.Close()

                    DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

                    Dim myODBCConnection As New OdbcConnection(DecryptedStr)
                    myODBCConnection.Open()

                    Dim MyAdpater As New OdbcDataAdapter(MyDBAction.ToString, myODBCConnection)
                    Dim MyDataTable As New Data.DataTable
                    MyAdpater.Fill(MyDataTable)
                    myODBCConnection.Close()

                    Return MyDataTable

                Case 11

                    DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function Call_Confirmation(ByVal Proposer_ID As String, ByVal Confirm_Call_Code As String, ByVal Confirm_Call_By As String, ByVal Confirm_Call_Date As String, ByVal Correct_Cover As String, ByVal Welcome_Package As String, ByVal Ack_Consent As String, ByVal Policy_Terms_Exp As String, ByVal Satisfied_with_info As String, ByVal Call_Notes As String, ByVal FOLLOWUP As String, ByVal CALL_TYPE As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[sp_Call_Confirmation]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@Proposer_ID", Data.SqlDbType.VarChar, 50).Value = Proposer_ID
                .Parameters.Add("@Confirm_Call_Code", Data.SqlDbType.VarChar, 50).Value = Confirm_Call_Code
                .Parameters.Add("@Confirm_Call_By", Data.SqlDbType.VarChar, 100).Value = Confirm_Call_By
                .Parameters.Add("@Confirm_Call_Date", Data.SqlDbType.VarChar, 50).Value = Confirm_Call_Date
                .Parameters.Add("@Correct_Cover", Data.SqlDbType.VarChar, 5).Value = Correct_Cover
                .Parameters.Add("@Welcome_Package", Data.SqlDbType.VarChar, 5).Value = Welcome_Package
                .Parameters.Add("@Ack_Consent", Data.SqlDbType.VarChar, 5).Value = Ack_Consent
                .Parameters.Add("@Policy_Terms_Exp", Data.SqlDbType.VarChar, 5).Value = Policy_Terms_Exp
                .Parameters.Add("@Satisfied_with_info", Data.SqlDbType.VarChar, 5).Value = Satisfied_with_info
                .Parameters.Add("@Call_Notes", Data.SqlDbType.VarChar, 5).Value = Call_Notes
                .Parameters.Add("@FOLLOWUP", Data.SqlDbType.VarChar, 5).Value = FOLLOWUP
                .Parameters.Add("@CALL_TYPE", Data.SqlDbType.VarChar, 50).Value = CALL_TYPE
                .ExecuteNonQuery()
            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function ENROLL_UPDATE_EMAIL(ByVal POLICY_CODE As String, ByVal EMAIL_SEND As Boolean, ByVal RT As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_UPDATE_EMAIL", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@POLICY_CODE", Data.SqlDbType.VarChar, 150).Value = POLICY_CODE
                .Parameters.Add("@EMAIL_SEND", Data.SqlDbType.Bit, 150).Value = EMAIL_SEND
                .Parameters.Add("@RT", Data.SqlDbType.VarChar, 50).Value = RT

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function TRACKING_ALLOCATION_DECLINE(ByVal File_No As String, ByVal Action_Date As String, ByVal Action_By As String, ByVal Action_To As String, ByVal Reason As String, ByVal Action As String, ByVal MU_Revert As Integer) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Business_MEDUW_Action", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Action_By", Data.SqlDbType.VarChar, 50).Value = Action_By
                .Parameters.Add("@Action_To", Data.SqlDbType.VarChar, 50).Value = Action_To
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 250).Value = Reason
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 5).Value = Action
                .Parameters.Add("@MU_Revert", Data.SqlDbType.Int).Value = MU_Revert
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_ALLOCATION_UW(ByVal File_No As String, ByVal Action_Date As String, ByVal Action_By As String, ByVal Action_To As String, ByVal Reason As String, ByVal Action As String, ByVal MU_Revert As Integer, ByVal Lateral_Movement As Integer) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Business_MEDUW_Action", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Action_By", Data.SqlDbType.VarChar, 50).Value = Action_By
                .Parameters.Add("@Action_To", Data.SqlDbType.VarChar, 50).Value = Action_To
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 250).Value = Reason
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 5).Value = Action
                .Parameters.Add("@MU_Revert", Data.SqlDbType.Int).Value = MU_Revert
                .Parameters.Add("@Lateral_Movement", Data.SqlDbType.Int).Value = Lateral_Movement
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_ALLOCATION_POLICYSIGN(ByVal File_No As String, ByVal Action_Date As String, ByVal Action_By As String, ByVal Action_To As String, ByVal Reason As String, ByVal Action As String, ByVal Policy_Code As String, ByVal Invoice_No As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Business_Policy_Action", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Action_By", Data.SqlDbType.VarChar, 50).Value = Action_By
                .Parameters.Add("@Action_To", Data.SqlDbType.VarChar, 50).Value = Action_To
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 250).Value = Reason
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 5).Value = Action
                '.Parameters.Add("@Family_Code", Data.SqlDbType.VarChar, 10).Value = Family_Code
                .Parameters.Add("@@Policy_Code", Data.SqlDbType.VarChar, 50).Value = Policy_Code
                .Parameters.Add("@Invoice_No", Data.SqlDbType.VarChar, 50).Value = Invoice_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_ALLOCATION_UPDATE(ByVal File_No As String, ByVal Action_Date As String, ByVal Action_By As String, ByVal Action_To As String, ByVal Reason As String, ByVal Action As String, ByVal Invoice_No As String, ByVal Policy_Code As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Business_update_Action", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Action_By", Data.SqlDbType.VarChar, 50).Value = Action_By
                .Parameters.Add("@Action_To", Data.SqlDbType.VarChar, 50).Value = Action_To
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 250).Value = Reason
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 5).Value = Action
                .Parameters.Add("@Policy_Code", Data.SqlDbType.VarChar, 50).Value = Policy_Code
                .Parameters.Add("@Invoice_No", Data.SqlDbType.VarChar, 50).Value = Invoice_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_ALLOCATION_CASHIER(ByVal File_No As String, ByVal Action_Date As String, ByVal Action_By As String, ByVal Action_To As String, ByVal Reason As String, ByVal Action As String, ByVal Invoice_No As String, ByVal Receipt_No As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Business_Cashier_Action", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Action_By", Data.SqlDbType.VarChar, 50).Value = Action_By
                .Parameters.Add("@Action_To", Data.SqlDbType.VarChar, 50).Value = Action_To
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 250).Value = Reason
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 5).Value = Action
                .Parameters.Add("@Receipt_No", Data.SqlDbType.VarChar, 50).Value = Receipt_No
                .Parameters.Add("@Invoice_No", Data.SqlDbType.VarChar, 50).Value = Invoice_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        '--FILE_NO.Text, Trim(txtinv.Text.ToUpper), txtProposer.Text, txtpolicy.Text, cboclient.Text, "eOx", cboRate.SelectedValue, cboRiskReason.SelectedValue, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"))

        Public Function TRACKING_AML_RISKS(ByVal File_No As String, ByVal INV_NO As String, ByVal PROPOSER As String, ByVal POLICY_CODE As String,
                                           ByVal CLIENT_TYPE As String, ByVal SYSTEM As String, ByVal RISK_RATE As String,
                                           ByVal RISK_REASON As String, ByVal ENTERED_By As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[AAR_RISK_DB].dbo.SP_MIS_TRACKING_AML_RISKS", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@INV_NO", Data.SqlDbType.VarChar, 50).Value = INV_NO

                .Parameters.Add("@PROPOSER", Data.SqlDbType.VarChar, 50).Value = PROPOSER
                .Parameters.Add("@POLICY_CODE", Data.SqlDbType.VarChar, 50).Value = POLICY_CODE
                .Parameters.Add("@CLIENT_TYPE", Data.SqlDbType.VarChar, 50).Value = CLIENT_TYPE

                .Parameters.Add("@SYSTEM", Data.SqlDbType.VarChar, 10).Value = SYSTEM
                .Parameters.Add("@RISK_RATE", Data.SqlDbType.VarChar, 50).Value = RISK_RATE

                .Parameters.Add("@RISK_REASON", Data.SqlDbType.VarChar, 50).Value = RISK_REASON
                .Parameters.Add("@ENTERED_By", Data.SqlDbType.VarChar, 50).Value = ENTERED_By


                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_CREDIT_NOTES(ByVal File_No As String, ByVal Cr_No As String, ByVal Cr_Amount As Decimal, ByVal Generated_By As String, ByVal Forwarded_To As String, ByVal Generate_Date As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_CREDIT_NOTES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Cr_No", Data.SqlDbType.VarChar, 50).Value = Cr_No
                .Parameters.Add("@Cr_Amount", Data.SqlDbType.Decimal).Value = Cr_Amount
                .Parameters.Add("@Generated_By", Data.SqlDbType.VarChar, 50).Value = Generated_By
                .Parameters.Add("@Forwarded_To", Data.SqlDbType.VarChar, 50).Value = Forwarded_To
                .Parameters.Add("@Generate_Date", Data.SqlDbType.VarChar, 50).Value = Generate_Date

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function Claim_processing(ByVal File_No As String, ByVal Action_Date As String, ByVal Action_By As String, ByVal Action_To As String, ByVal Reason As String, ByVal Action As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Claims_Process_Action", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Action_By", Data.SqlDbType.VarChar, 50).Value = Action_By
                .Parameters.Add("@Action_To", Data.SqlDbType.VarChar, 50).Value = Action_To
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 250).Value = Reason
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 5).Value = Action
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function Claim_Approval(ByVal File_No As String, ByVal Action_Date As String, ByVal Action_By As String, ByVal Action_To As String, ByVal Reason As String, ByVal Action As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Claims_Approval_Action", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Action_By", Data.SqlDbType.VarChar, 50).Value = Action_By
                .Parameters.Add("@Action_To", Data.SqlDbType.VarChar, 50).Value = Action_To
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 250).Value = Reason
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 5).Value = Action
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_ALLOCATION_MSHIP(ByVal File_No As String, ByVal Action_Date As String, ByVal Action_By As String, ByVal Action_To As String, ByVal Reason As String, ByVal Action As String, ByVal Invoice_No As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Business_Mship_Action", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Action_By", Data.SqlDbType.VarChar, 50).Value = Action_By
                .Parameters.Add("@Action_To", Data.SqlDbType.VarChar, 50).Value = Action_To
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 250).Value = Reason
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 5).Value = Action
                .Parameters.Add("@Invoice_No", Data.SqlDbType.VarChar, 25).Value = Invoice_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function GI_LOADING(ByVal Policy_code As String, ByVal Period_From As String, ByVal Period_to As String, ByVal Loading_Type As String, ByVal Loading_Rate As Decimal, ByVal Basic_Premium As Decimal, ByVal Insured_AMT As Decimal, ByVal Loaded_By As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[AIMSOFT_DATADUMP].[dbo].SP_MIs_GI_Loading", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Policy_Number", Data.SqlDbType.VarChar, 50).Value = Policy_code
                .Parameters.Add("@Period_From", Data.SqlDbType.VarChar, 50).Value = Period_From
                .Parameters.Add("@Period_to", Data.SqlDbType.VarChar, 50).Value = Period_to
                .Parameters.Add("@Loading_Item", Data.SqlDbType.VarChar, 50).Value = Loading_Type
                .Parameters.Add("@Loading_Rate", Data.SqlDbType.Decimal).Value = Loading_Rate
                .Parameters.Add("@Basic_Premium", Data.SqlDbType.Decimal).Value = Basic_Premium
                .Parameters.Add("@Sum_Insured", Data.SqlDbType.Decimal).Value = Insured_AMT
                .Parameters.Add("@Loaded_By", Data.SqlDbType.VarChar, 50).Value = Loaded_By
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        ' 'EXEC [dbo].[SP_GI_Loading_Per_Class] '2026-06-01', '2026-06-30',0.0001,'FIRE INDUSTRIAL','P'
        Public Function GI_LOADING_CLASS(ByVal Period_From As String, ByVal Period_to As String, ByVal Loading_Rate As Decimal, ByVal Loading_Class As String, ByVal Loading_Type As String, ByVal Loaded_By As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[AIMSOFT_DATADUMP].[dbo].[SP_GI_Loading_Per_Class_1] ", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure


                .Parameters.Add("@Period_From", Data.SqlDbType.VarChar, 50).Value = Period_From
                .Parameters.Add("@Period_to", Data.SqlDbType.VarChar, 50).Value = Period_to
                .Parameters.Add("@Loading_Item", Data.SqlDbType.VarChar, 50).Value = Loading_Type
                .Parameters.Add("@Loading_Rate", Data.SqlDbType.Decimal).Value = Loading_Rate
                .Parameters.Add("@Policy_Number", Data.SqlDbType.VarChar, 50).Value = Loading_Class
                .Parameters.Add("@Loaded_By", Data.SqlDbType.VarChar, 50).Value = Loaded_By
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function GI_LOADING_POST(ByVal Period_From As String, ByVal Period_to As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[AIMSOFT_DATADUMP].[dbo].[SP_GI_Loading_POST]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure


                .Parameters.Add("@Period_From", Data.SqlDbType.VarChar, 50).Value = Period_From
                .Parameters.Add("@Period_to", Data.SqlDbType.VarChar, 50).Value = Period_to

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_ALLOCATION(ByVal File_No As String, ByVal Action_Date As String, ByVal Action_By As String, ByVal Action_To As String, ByVal Reason As String, ByVal Action As String, ByVal Benefit_verified As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Business_Tracking_Action", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Action_By", Data.SqlDbType.VarChar, 50).Value = Action_By
                .Parameters.Add("@Action_To", Data.SqlDbType.VarChar, 50).Value = Action_To
                .Parameters.Add("@Reason", Data.SqlDbType.VarChar, 250).Value = Reason
                .Parameters.Add("@Action", Data.SqlDbType.VarChar, 5).Value = Action
                .Parameters.Add("@Benefit_verified", Data.SqlDbType.VarChar, 5).Value = Benefit_verified
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function Register_OP(ByVal File_No As String, ByVal Provider_Id As String, ByVal Provider_name As String, ByVal Invoice_no As String, ByVal Invoice_Amt As Decimal, ByVal Email_Date As String, _
                                      ByVal Receive_Date As String, ByVal Scan_date As String, ByVal Index_Date As String, ByVal Bar_Code As String, ByVal Entered_By As String, ByVal Entry_date As String, ByVal STS As Integer, ByVal Close As Integer) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("dbo.SP_Register_OP_Claim", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 150).Value = File_No
                .Parameters.Add("@Provider_Id", Data.SqlDbType.VarChar, 150).Value = Provider_Id
                .Parameters.Add("@Provider_name", Data.SqlDbType.VarChar, 150).Value = Provider_name
                .Parameters.Add("@Invoice_no", Data.SqlDbType.VarChar, 150).Value = Invoice_no
                .Parameters.Add("@Invoice_Amt", Data.SqlDbType.Decimal).Value = Invoice_Amt
                .Parameters.Add("@Receive_Date", Data.SqlDbType.VarChar, 50).Value = Receive_Date
                .Parameters.Add("@Email_Date", Data.SqlDbType.VarChar, 50).Value = Email_Date
                .Parameters.Add("@Scan_date", Data.SqlDbType.VarChar, 50).Value = Scan_date
                .Parameters.Add("@Index_Date", Data.SqlDbType.VarChar, 50).Value = Index_Date
                .Parameters.Add("@Entered_by", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Entry_date", Data.SqlDbType.VarChar, 50).Value = Entry_date
                .Parameters.Add("@Bar_Code", Data.SqlDbType.VarChar, 50).Value = Bar_Code
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .Parameters.Add("@Closed", Data.SqlDbType.Int).Value = Close
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function Register_PNI_Billing(ByVal Ref_No As String, ByVal Invoice_No As String, ByVal Invoice_Amt As Decimal, ByVal Invoice_Dt As String, ByVal DoA As String, ByVal DoD As String, ByVal Total_Bill As Decimal, ByVal Cover_Limit As Decimal, ByVal Overshot As Decimal, ByVal Admin_Fee As Decimal, ByVal Pay_N_Invoice As Decimal, ByVal Authorized_By As String,
            ByVal Sign_Off_By As String, ByVal Sign_Off_Dt As String, ByVal Entered_By As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("dbo.SP_Register_PNI_BILL", myConnection)
            '  [Id],[Ref_No],[New_Member],[Member_No],[Member_Name],[Proposer_Name],[Provider_ID],[Inv_Status]
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@Ref_No", Data.SqlDbType.VarChar, 150).Value = Ref_No
                .Parameters.Add("@Invoice_No", Data.SqlDbType.VarChar, 50).Value = Invoice_No
                .Parameters.Add("@Invoice_Amt", Data.SqlDbType.Decimal).Value = Invoice_Amt
                .Parameters.Add("@Invoice_Dt", Data.SqlDbType.VarChar, 20).Value = Invoice_Dt
                .Parameters.Add("@DoA", Data.SqlDbType.VarChar, 20).Value = DoA
                .Parameters.Add("@DoD", Data.SqlDbType.VarChar, 20).Value = DoD
                .Parameters.Add("@Total_Bill", Data.SqlDbType.Decimal).Value = Total_Bill
                .Parameters.Add("@Cover_Limit", Data.SqlDbType.Decimal).Value = Cover_Limit
                .Parameters.Add("@Overshot", Data.SqlDbType.Decimal).Value = Overshot
                .Parameters.Add("@Admin_Fee", Data.SqlDbType.Decimal).Value = Admin_Fee
                .Parameters.Add("@Pay_N_Invoice", Data.SqlDbType.Decimal).Value = Pay_N_Invoice
                .Parameters.Add("@Authorized_By", Data.SqlDbType.VarChar, 50).Value = Authorized_By
                .Parameters.Add("@Sign_Off_By", Data.SqlDbType.VarChar, 50).Value = Sign_Off_By
                .Parameters.Add("@Sign_Off_Dt", Data.SqlDbType.VarChar, 20).Value = Sign_Off_Dt
                .Parameters.Add("@Entered_by", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function Register_PNI(ByVal Ref_No As String, ByVal New_Member As String, ByVal Receive_dt As String, ByVal Service_dt As String, ByVal Member_No As String, ByVal Member_Name As String, ByVal Provider_ID As String, ByVal Proposer_Name As String, ByVal Entered_by As String) As Integer


            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("dbo.SP_Register_PNI_Claim", myConnection)
            '  [Id],[Ref_No],[New_Member],[Member_No],[Member_Name],[Proposer_Name],[Provider_ID],[Inv_Status]
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@Ref_No", Data.SqlDbType.VarChar, 150).Value = Ref_No
                .Parameters.Add("@New_Member", Data.SqlDbType.Int).Value = New_Member
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 150).Value = Member_No
                .Parameters.Add("@Member_Name", Data.SqlDbType.VarChar, 50).Value = Member_Name
                .Parameters.Add("@Service_dt", Data.SqlDbType.VarChar, 150).Value = Service_dt
                .Parameters.Add("@Provider_ID", Data.SqlDbType.VarChar, 150).Value = Provider_ID
                '.Parameters.Add("@Invoice_No", Data.SqlDbType.VarChar, 150).Value = Invoice_No
                '.Parameters.Add("@Invoice_Amt", Data.SqlDbType.Decimal).Value = Invoice_Amt
                .Parameters.Add("@Entered_by", Data.SqlDbType.VarChar, 150).Value = Entered_by
                '.Parameters.Add("@Bar_code", Data.SqlDbType.VarChar, 150).Value = Bar_code
                .Parameters.Add("@Proposer_Name", Data.SqlDbType.VarChar, 100).Value = Proposer_Name
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function Register_IP(ByVal File_No As String, ByVal Receive_dt As String, ByVal Service_dt As String, ByVal Member_No As String, ByVal Provider_Code As String, _
                                       ByVal Invoice_No As String, ByVal Invoice_Amt As Decimal, ByVal Entered_by As String, ByVal Bar_code As String, ByVal Member_Name As String, ByVal Provider_Name As String, ByVal STS As String, ByVal Discharge_dt As String, ByVal Proposer As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("dbo.SP_Register_IP_Claim", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 150).Value = File_No
                .Parameters.Add("@Receive_dt", Data.SqlDbType.VarChar, 150).Value = Receive_dt
                .Parameters.Add("@Service_dt", Data.SqlDbType.VarChar, 150).Value = Service_dt
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 150).Value = Member_No
                .Parameters.Add("@Provider_Code", Data.SqlDbType.VarChar, 150).Value = Provider_Code
                .Parameters.Add("@Invoice_No", Data.SqlDbType.VarChar, 150).Value = Invoice_No
                .Parameters.Add("@Invoice_Amt", Data.SqlDbType.Decimal).Value = Invoice_Amt
                .Parameters.Add("@Entered_by", Data.SqlDbType.VarChar, 150).Value = Entered_by
                .Parameters.Add("@Bar_code", Data.SqlDbType.VarChar, 150).Value = Bar_code
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .Parameters.Add("@Prov_Name", Data.SqlDbType.VarChar, 50).Value = Provider_Name
                .Parameters.Add("@Member_Name", Data.SqlDbType.VarChar, 50).Value = Member_Name
                .Parameters.Add("@Memb_Disch_dt", Data.SqlDbType.VarChar, 50).Value = Discharge_dt
                .Parameters.Add("@Proposer", Data.SqlDbType.VarChar, 100).Value = Proposer
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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("dbo.SP_Register_REIMB_Claim", myConnection)

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
                '.Parameters.Add("@Proposer", Data.SqlDbType.VarChar, 100).Value = Proposer
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function TRACK_FILE_REQ(ByVal Req_No As String, ByVal Department As String, ByVal Member_No As String, ByVal Proposer As String, ByVal Req As Integer, _
       ByVal Req_Date As String, ByVal exp_Return_Date As String, ByVal COMMENT As String, ByVal Req_By As String, ByVal ENTERED_BY As String, ByVal trans As Integer, ByVal Trans_TO As String, ByVal Trans_By As String, ByVal sts As Integer) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("MISREPORTS.dbo.SP_TRACK_FILE_REQ", myConnection)

            With myCommand

                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@Req_No", Data.SqlDbType.VarChar, 150).Value = Req_No
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 150).Value = Member_No
                .Parameters.Add("@Department", Data.SqlDbType.VarChar, 150).Value = Department
                .Parameters.Add("@exp_Return_Date", Data.SqlDbType.VarChar, 150).Value = exp_Return_Date
                .Parameters.Add("@Proposer", Data.SqlDbType.VarChar, 150).Value = Proposer
                .Parameters.Add("@Req", Data.SqlDbType.Int).Value = Req
                .Parameters.Add("@Req_Date", Data.SqlDbType.VarChar, 50).Value = Req_Date
                .Parameters.Add("@COMMENT", Data.SqlDbType.VarChar, 150).Value = COMMENT
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 150).Value = ENTERED_BY
                .Parameters.Add("@Trans_By", Data.SqlDbType.VarChar, 150).Value = Trans_By
                .Parameters.Add("@Trans_TO", Data.SqlDbType.VarChar, 150).Value = Trans_TO
                .Parameters.Add("@trans", Data.SqlDbType.Int).Value = trans
                .Parameters.Add("@Req_By", Data.SqlDbType.VarChar, 150).Value = Req_By
                .Parameters.Add("@sts", Data.SqlDbType.Int).Value = sts

                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function

        Public Function BUSINESS_REALLOCATE(ByVal File_No As String, ByVal Allocated_To As String, ByVal Allocate_Date As String, ByVal Reallocate_To As String, ByVal Reallocate_Dt As String, ByVal Reallocate_By As String, ByVal Comments As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_MSHIP_REALLOCATE", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Allocated_To", Data.SqlDbType.VarChar, 50).Value = Allocated_To
                .Parameters.Add("@Allocate_Date", Data.SqlDbType.DateTime).Value = Allocate_Date
                .Parameters.Add("@Reallocate_To", Data.SqlDbType.VarChar, 50).Value = Reallocate_To
                .Parameters.Add("@Reallocate_Dt", Data.SqlDbType.VarChar, 50).Value = Reallocate_Dt
                .Parameters.Add("@Reallocate_By", Data.SqlDbType.VarChar, 50).Value = Reallocate_By
                .Parameters.Add("@Comments", Data.SqlDbType.VarChar, 500).Value = Comments
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        'File_No,File_Status,Entry_Dt,Entered_By
        Public Function TRACKING_IP_CLAIM_ISSUES(ByVal File_No As String, ByVal File_Status As String, ByVal Entry_Dt As String, ByVal Entered_By As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_IP_Claim_Issues", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@File_Status", Data.SqlDbType.VarChar, 50).Value = File_Status
                .Parameters.Add("@Entry_Dt", Data.SqlDbType.VarChar, 50).Value = Entry_Dt
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_IP_CLAIM_MESSAGES(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_TRACKING_IP_CLAIM_MESSAGES", myConnection)

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
        Public Function TRACKING_PNI_CLAIM_MESSAGES(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_TRACKING_PNI_CLAIM_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Notes", Data.SqlDbType.VarChar, 500).Value = Note
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_UW_MESSAGES(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[dbo].[sp_MIS_CRM_LOADING_NOTES]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Note", Data.SqlDbType.VarChar, 500).Value = Note
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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_TRACKING_CLAIM_MESSAGES", myConnection)

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
        Public Function TRACKING_COV_RESULT(ByVal Member_No As String, ByVal Case_Code As String, ByVal Test_Result As String, ByVal Test_date As String, ByVal Entered_By As String, ByVal Entry_date As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_COV_MEMBER_RESULTS", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Test_Result", Data.SqlDbType.VarChar, 50).Value = Test_Result
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Entry_date", Data.SqlDbType.NVarChar, 50).Value = Entry_date
                .Parameters.Add("@Case_Code", Data.SqlDbType.VarChar, 50).Value = Case_Code
                .Parameters.Add("@Test_date", Data.SqlDbType.NVarChar, 50).Value = Test_date

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_COV_PROV(ByVal Member_No As String, ByVal Case_Code As String, ByVal Prov_Code As String, ByVal Adm_Date As String, ByVal Prov_Type As String, ByVal Entered_By As String, ByVal Entry_date As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_COV_MEMBER_PROV", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Prov_Code", Data.SqlDbType.VarChar, 150).Value = Prov_Code
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Entry_date", Data.SqlDbType.NVarChar, 50).Value = Entry_date
                .Parameters.Add("@Case_Code", Data.SqlDbType.VarChar, 50).Value = Case_Code
                .Parameters.Add("@Adm_Date", Data.SqlDbType.NVarChar, 50).Value = Adm_Date
                .Parameters.Add("@Prov_Type", Data.SqlDbType.VarChar, 50).Value = Prov_Type
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function Register_Claims_rec(ByVal FILE_NO As String, ByVal RECEIVE_DT As String, ByVal CLAIM_TYPE As String, _
                                       ByVal INVOICE_CNT As Integer, ByVal INVOICE_AMT As Decimal, ByVal PROVIDER_ID As String, ByVal PROVIDER_NAME As String, ByVal COMMENT As String, ByVal Entered_by As String, ByVal STS As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("MISREPORTS.dbo.SP_Register_Claims_rec", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@FILE_NO", Data.SqlDbType.VarChar, 150).Value = FILE_NO
                .Parameters.Add("@RECEIVE_DT", Data.SqlDbType.VarChar, 150).Value = RECEIVE_DT

                .Parameters.Add("@CLAIM_TYPE", Data.SqlDbType.VarChar, 150).Value = CLAIM_TYPE
                .Parameters.Add("@INVOICE_CNT", Data.SqlDbType.Int).Value = INVOICE_CNT

                .Parameters.Add("@INVOICE_AMT", Data.SqlDbType.Decimal).Value = INVOICE_AMT
                .Parameters.Add("@PROVIDER_ID", Data.SqlDbType.VarChar, 150).Value = PROVIDER_ID
                .Parameters.Add("@COMMENT", Data.SqlDbType.VarChar, 150).Value = COMMENT
                .Parameters.Add("@Entered_by", Data.SqlDbType.VarChar, 150).Value = Entered_by
                .Parameters.Add("@PROVIDER_NAME", Data.SqlDbType.VarChar, 150).Value = PROVIDER_NAME
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_COV_COST(ByVal Case_Code As String, ByVal Prov_Code As String, ByVal Cost_Code As String, ByVal Cost_Date As String, ByVal Pre_Auth_Amount As Decimal, ByVal Cost_Amount As Decimal, ByVal Entered_By As String, ByVal Entry_date As String, ByVal Notes As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_COV_MEMBER_COST", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Prov_Code", Data.SqlDbType.VarChar, 150).Value = Prov_Code
                .Parameters.Add("@Case_Code", Data.SqlDbType.VarChar, 50).Value = Case_Code
                .Parameters.Add("@Cost_Amount", Data.SqlDbType.Decimal).Value = Cost_Amount
                .Parameters.Add("@Pre_Auth_Amount", Data.SqlDbType.Decimal).Value = Pre_Auth_Amount
                .Parameters.Add("@Cost_Code", Data.SqlDbType.VarChar, 50).Value = Cost_Code
                .Parameters.Add("@Cost_Date", Data.SqlDbType.VarChar, 50).Value = Cost_Date
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Entry_date", Data.SqlDbType.NVarChar, 50).Value = Entry_date
                .Parameters.Add("@Notes", Data.SqlDbType.NVarChar, 500).Value = Notes
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_HPC_FOLLOWUP(ByVal Member_No As String, ByVal Scheduled_date As String, ByVal Followup_Date As String, ByVal Entered_By As String, ByVal Entry_date As String, Member_Call As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_HPC_MEMBER_FOLLOWUP", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Scheduled_date", Data.SqlDbType.VarChar, 50).Value = Scheduled_date
                .Parameters.Add("@Followup_Date", Data.SqlDbType.VarChar, 50).Value = Followup_Date
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Entry_date", Data.SqlDbType.NVarChar, 50).Value = Entry_date
                .Parameters.Add("@Member_Call", Data.SqlDbType.VarChar, 5).Value = Member_Call

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_HPC_COMORB(ByVal Dx_Date As String, ByVal DX_code As String, ByVal Member_No As String, ByVal Entered_By As String, ByVal Entry_date As String, ByVal Doctor As String, ByVal Other_Doctor As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_HPC_MEMBER_COMORB", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@DX_code", Data.SqlDbType.VarChar, 50).Value = DX_code
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Entry_date", Data.SqlDbType.NVarChar, 50).Value = Entry_date
                .Parameters.Add("@Doctor", Data.SqlDbType.VarChar, 100).Value = Doctor
                .Parameters.Add("@Other_Doctor", Data.SqlDbType.VarChar, 100).Value = Other_Doctor
                .Parameters.Add("@Dx_Date", Data.SqlDbType.VarChar, 50).Value = Dx_Date
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_COV_COMORB(ByVal Dx_Date As String, ByVal Comorb_code As String, ByVal Member_No As String, ByVal Entered_By As String, ByVal Entry_date As String, Case_No As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_COV_MEMBER_COMORB", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Comorb_code", Data.SqlDbType.VarChar, 50).Value = Comorb_code
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Entry_date", Data.SqlDbType.NVarChar, 50).Value = Entry_date
                .Parameters.Add("@Case_No", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Dx_Date", Data.SqlDbType.VarChar, 50).Value = Dx_Date
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_PREAUTH_MESSAGES(ByVal Member_No As String, ByVal Case_Code As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String, Note_type As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_PREAUTH_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Case_Code", Data.SqlDbType.VarChar, 50).Value = Case_Code
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Note", Data.SqlDbType.NVarChar, 1000).Value = Note
                .Parameters.Add("@Note_type", Data.SqlDbType.VarChar, 50).Value = Note_type
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_OFF_SYSTEM_MESSAGES(ByVal Ref_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_OFF_SYSTEM_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Ref_No", Data.SqlDbType.VarChar, 50).Value = Ref_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Note", Data.SqlDbType.NVarChar, 1000).Value = Note
                '.Parameters.Add("@Note_type", Data.SqlDbType.VarChar, 50).Value = Note_type

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_COMMITTAL_UPDATE(ByVal Ref_no As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_MIS_CRM_Committal_enrichment_1", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Ref_no", Data.SqlDbType.VarChar, 50).Value = Ref_no
              

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_COMMITTAL_MESSAGES(ByVal Ref_no As String, ByVal Notes As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note_type As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_COMMITAL_SYSTEM_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Ref_no", Data.SqlDbType.VarChar, 50).Value = Ref_no
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Notes", Data.SqlDbType.NVarChar, 1000).Value = Notes
                .Parameters.Add("@Note_type", Data.SqlDbType.VarChar, 50).Value = Note_type

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function IP_SCHEDULE_MESSAGES(ByVal Member_No As String, ByVal Case_No As String, ByVal Note_From As String, ByVal Action_Date As String, ByVal Note As String, Note_Status As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_IP_SCHEDULE_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Case_No", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Action_Date", Data.SqlDbType.VarChar, 50).Value = Action_Date
                .Parameters.Add("@Notes", Data.SqlDbType.NVarChar, 1000).Value = Note
                .Parameters.Add("@Note_Status", Data.SqlDbType.VarChar, 50).Value = Note_Status
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_IP_DOC_MESSAGES(ByVal Doc_Id As String, ByVal Member_No As String, ByVal Case_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String, Note_type As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_IP_DOC_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Doc_Id", Data.SqlDbType.VarChar, 50).Value = Doc_Id
                .Parameters.Add("@Case_No", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Notes", Data.SqlDbType.NVarChar, 1000).Value = Note
                .Parameters.Add("@Note_type", Data.SqlDbType.VarChar, 50).Value = Note_type
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TRACKING_HPC_MESSAGES(ByVal Member_No As String, ByVal Dx_Code As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String, Note_type As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_HPC_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Dx_Code", Data.SqlDbType.VarChar, 50).Value = Dx_Code
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Note", Data.SqlDbType.NVarChar, 1000).Value = Note
                .Parameters.Add("@Note_type", Data.SqlDbType.VarChar, 50).Value = Note_type
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function RENEWAL_EMAIL_DISPATCH_NON(ByVal Data_date As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[AIMSOFT_DATADUMP].[dbo].[sp_Renewal_Schedules_Non_Med_Verified]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Data_date", Data.SqlDbType.VarChar, 50).Value = Data_date



                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function RENEWAL_EMAIL_DISPATCH_ACTIVITY(ByVal Period_From As String, ByVal Period_To As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DB_MASTER_RENEWAL].dbo.[SP_MIS_RENEWAL_COMM_LIST]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Period_From", Data.SqlDbType.VarChar, 50).Value = Period_From
                .Parameters.Add("@Period_To", Data.SqlDbType.VarChar, 50).Value = Period_To


                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        
        Public Function TRACKING_COV_MESSAGES(ByVal Member_No As String, ByVal Case_Code As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String, Note_type As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_MIS_CRM_COV_MESSAGES", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Case_Code", Data.SqlDbType.VarChar, 50).Value = Case_Code
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Note", Data.SqlDbType.NVarChar, 1000).Value = Note
                .Parameters.Add("@Note_type", Data.SqlDbType.VarChar, 50).Value = Note_type
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function RESOLVE_IP_CAREMANAGER(ByVal FILE_NO As String, ByVal ID As Integer, ByVal RESOLVED As String, ByVal RESOLVE_DT As String, ByVal COMMENT As String, ByVal RESOLVED_BY As String, ByVal QUERY_TO As String, ByVal QUERY_TO_NAME As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[MISREPORTS].[dbo].SP_IP_RESOLVE", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@FILE_NO", Data.SqlDbType.VarChar, 150).Value = FILE_NO
                .Parameters.Add("@ID", Data.SqlDbType.Int).Value = ID
                .Parameters.Add("@RESOLVED", Data.SqlDbType.VarChar, 150).Value = RESOLVED
                .Parameters.Add("@RESOLVE_DT", Data.SqlDbType.VarChar, 150).Value = RESOLVE_DT
                .Parameters.Add("@QUERY_TO", Data.SqlDbType.VarChar, 150).Value = QUERY_TO
                .Parameters.Add("@COMMENT", Data.SqlDbType.VarChar, 250).Value = COMMENT
                .Parameters.Add("@QUERY_TO_NAME", Data.SqlDbType.VarChar, 150).Value = QUERY_TO_NAME

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID

        End Function
        Public Function UPDATE_RISK(ByVal Period_From As String, ByVal Period_To As String, ByVal Depart_Code As String, ByVal Status As String, ByVal entered_by As String, ByVal Due_Date As String) As Integer
            ' [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[AAR_RISK_DB].dbo.sp_Mis_Risk_Activation", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Period_From", Data.SqlDbType.VarChar, 50).Value = Period_From
                '.Parameters.Add("@ID", Data.SqlDbType.Int).Value = ID
                .Parameters.Add("@Period_To", Data.SqlDbType.VarChar, 50).Value = Period_To
                .Parameters.Add("@Depart_Code", Data.SqlDbType.VarChar, 50).Value = Depart_Code
                '.Parameters.Add("@Owner_Code", Data.SqlDbType.VarChar, 50).Value = Owner_Code
                '.Parameters.Add("@Champion_Code", Data.SqlDbType.VarChar, 50).Value = Champion_Code
                .Parameters.Add("@Status", Data.SqlDbType.VarChar, 50).Value = Status
                .Parameters.Add("@entered_by", Data.SqlDbType.VarChar, 50).Value = entered_by
                .Parameters.Add("@Due_Date", Data.SqlDbType.VarChar, 50).Value = Due_Date
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function TRACK_IP_CAREMANAGER(ByVal FILE_NO As String, ByVal ID As Integer, ByVal ALLOCATED_TO As String, ByVal ALLOCATED_DT As String, ByVal COMMENT As String, ByVal ALLOCATED_BY As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("MISREPORTS.dbo.SP_IP_CAREMANAGER", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@FILE_NO", Data.SqlDbType.VarChar, 150).Value = FILE_NO
                .Parameters.Add("@ID", Data.SqlDbType.Int).Value = ID
                '.Parameters.Add("@ALLOCATED", Data.SqlDbType.Int).Value = ALLOCATED
                .Parameters.Add("@ALLOCATED_TO", Data.SqlDbType.Int).Value = ALLOCATED_TO
                .Parameters.Add("@ALLOCATED_DT", Data.SqlDbType.VarChar, 150).Value = ALLOCATED_DT
                .Parameters.Add("@COMMENT", Data.SqlDbType.VarChar, 250).Value = COMMENT
                .Parameters.Add("@ALLOCATED_BY", Data.SqlDbType.VarChar, 150).Value = ALLOCATED_BY
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
            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("dbo.SP_Refund_Decline", myConnection)

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
        Public Function TASK_MESSAGES_CORP(ByVal Proposer_id As String, ByVal Notes As String, ByVal Notes_by As String, ByVal Note_Date As DateTime, ByVal Notes_Type As String, ByVal FAMILY_NO As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function SAVE_REFUND_AMT(ByVal INVOICE_NO As String, ByVal INVOICE_DATE As String, ByVal REC_AMOUNT As Decimal, ByVal PROPOSER_ID As String, ByVal Entered_By As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DATA_REPOSITORY_DB].dbo.sp_MASTER_STATEMENT_REFUNDS", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@PROPOSER_ID", Data.SqlDbType.VarChar, 50).Value = PROPOSER_ID
                .Parameters.Add("@INVOICE_NO", Data.SqlDbType.NVarChar, 50).Value = INVOICE_NO
                .Parameters.Add("@INVOICE_DATE", Data.SqlDbType.NVarChar, 50).Value = INVOICE_DATE
                .Parameters.Add("@REC_AMOUNT", Data.SqlDbType.Decimal).Value = REC_AMOUNT
                .Parameters.Add("@Entered_By", Data.SqlDbType.NVarChar, 50).Value = Entered_By


                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID
        End Function
        Public Function STATEMENT_ADJ_AMT(ByVal INVOICE_NO As String, ByVal INVOICE_DATE As String, ByVal PROPOSER_ID As String, ByVal Entered_By As String, ByVal DR As Decimal, ByVal CR As Decimal, ByVal Trans_Type As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[CRM].[dbo].[sp_MASTER_STATEMENT_ADJ]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@PROPOSER_ID", Data.SqlDbType.VarChar, 50).Value = PROPOSER_ID
                .Parameters.Add("@INVOICE_NO", Data.SqlDbType.NVarChar, 50).Value = INVOICE_NO
                .Parameters.Add("@INVOICE_DATE", Data.SqlDbType.NVarChar, 50).Value = INVOICE_DATE
                .Parameters.Add("@DR", Data.SqlDbType.Decimal).Value = DR
                .Parameters.Add("@CR", Data.SqlDbType.Decimal).Value = CR
                .Parameters.Add("@Entered_By", Data.SqlDbType.NVarChar, 50).Value = Entered_By
                .Parameters.Add("@Trans_Type", Data.SqlDbType.NVarChar, 50).Value = Trans_Type


                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID
        End Function
        Public Function POST_STATEMENT_ADJ_AMT(ByVal INVOICE_NO As String, ByVal PROPOSER_ID As String, ByVal Entered_By As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[CRM].dbo.[sp_MASTER_STATEMENT_ADJ_POST]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@PROPOSER_ID", Data.SqlDbType.VarChar, 50).Value = PROPOSER_ID
                .Parameters.Add("@INVOICE_NO", Data.SqlDbType.NVarChar, 50).Value = INVOICE_NO
                .Parameters.Add("@Entered_By", Data.SqlDbType.NVarChar, 50).Value = Entered_By


                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID
        End Function
        Public Function PROPOSER_MAPPING(ByVal Entered_By As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DATA_REPOSITORY_DB].dbo.[SP_MIS_statement_ageing]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                '.Parameters.Add("@Entered_By", Data.SqlDbType.NVarChar, 50).Value = Entered_By
                myCommand.CommandTimeout = 300
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID
        End Function
        Public Function POST_REFUND_AMT(ByVal INVOICE_NO As String, ByVal PROPOSER_ID As String, ByVal Entered_By As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DATA_REPOSITORY_DB].dbo.[sp_MASTER_STATEMENT_REFUNDS_POST]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@PROPOSER_ID", Data.SqlDbType.VarChar, 50).Value = PROPOSER_ID
                .Parameters.Add("@INVOICE_NO", Data.SqlDbType.NVarChar, 50).Value = INVOICE_NO
                .Parameters.Add("@Entered_By", Data.SqlDbType.NVarChar, 50).Value = Entered_By


                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID
        End Function
        Public Function MINET_UPLOAD(ByVal BREAKUP_ID As String, ByVal CLAIM_ID As String, ByVal DISPLAY_MEMBERSHIP_NO As String, ByVal MEMBER_DISPLAY_NAME As String, ByVal PROPOSER_NAME As String, ByVal CLIENT_TYPE As String, ByVal PERIOD_FROM As String, ByVal PERIOD_TO As String, ByVal POLICY_ID As String, ByVal FUND_MANAGE As String, ByVal CATEGORY As String, ByVal AGE As String, ByVal INVOICE_NO As String, ByVal PROVIDER_NAME As String, ByVal CLAIM_AMOUNT As String, ByVal INVOICE_AMT As String, ByVal CLAIM_TYPE As String, ByVal CLAIM_SUB_TYPE As String, ByVal RECEIVE_DATE As String, ByVal ADMISSION_DATE As String, ByVal DISEASE_NAME As String, ByVal CLAIM_NO As String, ByVal SERVICE_TYPE As String, ByVal INWARD_DATE As String, ByVal BILL_STATUS As String, ByVal ADMIN As String, ByVal DATA_DATE As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[DATA_REPOSITORY_DB].dbo.SP_MIS_UPLOAD_MINET", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@BREAKUP_ID", Data.SqlDbType.VarChar, 50).Value = BREAKUP_ID
                .Parameters.Add("@CLAIM_ID", Data.SqlDbType.VarChar, 50).Value = CLAIM_ID
                .Parameters.Add("@DISPLAY_MEMBERSHIP_NO", Data.SqlDbType.VarChar, 50).Value = DISPLAY_MEMBERSHIP_NO
                .Parameters.Add("@MEMBER_DISPLAY_NAME", Data.SqlDbType.VarChar, 150).Value = MEMBER_DISPLAY_NAME
                .Parameters.Add("@PROPOSER_NAME", Data.SqlDbType.VarChar, 150).Value = PROPOSER_NAME
                .Parameters.Add("@CLIENT_TYPE", Data.SqlDbType.VarChar, 50).Value = CLIENT_TYPE
                .Parameters.Add("@PERIOD_FROM", Data.SqlDbType.VarChar, 50).Value = PERIOD_FROM
                .Parameters.Add("@PERIOD_TO", Data.SqlDbType.VarChar, 50).Value = PERIOD_TO
                .Parameters.Add("@POLICY_ID", Data.SqlDbType.VarChar, 50).Value = POLICY_ID
                .Parameters.Add("@FUND_MANAGE", Data.SqlDbType.VarChar, 50).Value = FUND_MANAGE
                .Parameters.Add("@CATEGORY", Data.SqlDbType.VarChar, 50).Value = CATEGORY
                .Parameters.Add("@AGE", Data.SqlDbType.VarChar, 50).Value = AGE
                .Parameters.Add("@INVOICE_NO", Data.SqlDbType.VarChar, 50).Value = INVOICE_NO
                .Parameters.Add("@PROVIDER_NAME", Data.SqlDbType.VarChar, 150).Value = PROVIDER_NAME
                .Parameters.Add("@CLAIM_AMOUNT", Data.SqlDbType.Decimal).Value = CLAIM_AMOUNT
                .Parameters.Add("@INVOICE_AMT", Data.SqlDbType.Decimal).Value = INVOICE_AMT
                .Parameters.Add("@CLAIM_TYPE", Data.SqlDbType.VarChar, 50).Value = CLAIM_TYPE
                .Parameters.Add("@CLAIM_SUB_TYPE", Data.SqlDbType.VarChar, 50).Value = CLAIM_SUB_TYPE
                .Parameters.Add("@RECEIVE_DATE", Data.SqlDbType.VarChar, 50).Value = RECEIVE_DATE
                .Parameters.Add("@ADMISSION_DATE", Data.SqlDbType.VarChar, 50).Value = ADMISSION_DATE
                .Parameters.Add("@DISEASE_NAME", Data.SqlDbType.VarChar, 150).Value = DISEASE_NAME
                .Parameters.Add("@CLAIM_NO", Data.SqlDbType.VarChar, 50).Value = CLAIM_NO
                .Parameters.Add("@SERVICE_TYPE", Data.SqlDbType.VarChar, 50).Value = SERVICE_TYPE
                .Parameters.Add("@INWARD_DATE", Data.SqlDbType.VarChar, 50).Value = INWARD_DATE
                .Parameters.Add("@BILL_STATUS", Data.SqlDbType.VarChar, 50).Value = BILL_STATUS
                .Parameters.Add("@ADMIN", Data.SqlDbType.VarChar, 50).Value = ADMIN
                .Parameters.Add("@DATA_DATE", Data.SqlDbType.VarChar, 50).Value = DATA_DATE

                .ExecuteNonQuery()
            End With

            myConnection.Close()

            Return myID

        End Function

        Public Function TRACKING_MESSAGES_NON(ByVal Policy_Number As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[dbo].[sp_Renewal_Notes]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Policy_Number", Data.SqlDbType.VarChar, 50).Value = Policy_Number
                .Parameters.Add("@Note_From", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Notes", Data.SqlDbType.VarChar, 500).Value = Note
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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_TRACKING_MESSAGES", myConnection)

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
        Public Function TRACKING_RISK_CAUSE(ByVal Risk_Code As String, ByVal Root_Cause As String, ByVal Current_Contr As String, ByVal Mitigations As String, ByVal Due_Date As String, ByVal Action_Owner As String, ByVal Action_Status As String, ByVal Updated_By As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[AAR_RISK_DB].dbo.sp_Mis_Risk_Cause", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Risk_Code", Data.SqlDbType.VarChar, 50).Value = Risk_Code
                .Parameters.Add("@Root_Cause", Data.SqlDbType.Text).Value = Root_Cause
                .Parameters.Add("@Current_Contr", Data.SqlDbType.Text).Value = Current_Contr
                .Parameters.Add("@Mitigations", Data.SqlDbType.Text).Value = Mitigations
                .Parameters.Add("@Due_Date", Data.SqlDbType.VarChar, 50).Value = Due_Date
                .Parameters.Add("@Action_Owner", Data.SqlDbType.VarChar, 50).Value = Action_Owner
                .Parameters.Add("@Action_Status", Data.SqlDbType.VarChar, 50).Value = Action_Status
                .Parameters.Add("@Updated_By", Data.SqlDbType.VarChar, 50).Value = Updated_By
                '.Parameters.Add("@UP", Data.SqlDbType.Int).Value = UP
                .ExecuteNonQuery()
            End With

            myConnection.Close()

            Return myID

        End Function
        Public Function TRACKING_RISK_NOTES(ByVal File_No As String, ByVal Note_From As String, ByVal Note_date As String, ByVal Note As String, ByVal Period_From As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[AAR_RISK_DB].dbo.sp_Mis_Risk_Notes", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Risk_Code", Data.SqlDbType.VarChar, 50).Value = File_No
                .Parameters.Add("@Notes_by", Data.SqlDbType.VarChar, 50).Value = Note_From
                .Parameters.Add("@Note_date", Data.SqlDbType.VarChar, 50).Value = Note_date
                .Parameters.Add("@Notes", Data.SqlDbType.VarChar, 500).Value = Note
                .Parameters.Add("@Period_From", Data.SqlDbType.VarChar, 50).Value = Period_From
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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function TASK_SUMMARY_COMPLAIN(ByVal Issue_Code As String, ByVal Depart_Code As String, ByVal Issue_Name As String, ByVal Supervisor As String, ByVal SLA_Hrs As Integer, ByVal sts As Integer) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("CRM.[dbo].[sp_MIS_CRM_COMPLAINT_SUMMARY]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Issue_Code", Data.SqlDbType.VarChar, 50).Value = Issue_Code
                .Parameters.Add("@Depart_Code", Data.SqlDbType.NVarChar, 50).Value = Depart_Code
                .Parameters.Add("@Issue_Name", Data.SqlDbType.NVarChar, 100).Value = Issue_Name
                .Parameters.Add("@Supervisor", Data.SqlDbType.VarChar, 50).Value = Supervisor
                .Parameters.Add("@SLA_Hrs", Data.SqlDbType.Int).Value = SLA_Hrs
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = sts
                '.Parameters.Add("@FAMILY_NO", Data.SqlDbType.VarChar, 50).Value = FAMILY_NO
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function TASK_MESSAGES_COMPLAIN(ByVal Proposer_id As String, ByVal Notes As String, ByVal Notes_by As String, ByVal Note_Date As DateTime, ByVal Notes_Type As String, ByVal FAMILY_NO As String) As Integer
            '[LEAD_CODE],[CHAT_FROM],[CHAT_TO],[MESSAGE],[FOLLOWUP_DATE],[ENTERED_BY]
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("CRM.[dbo].[sp_MIS_CRM_COMPLAINT_NOTES]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Case_No", Data.SqlDbType.VarChar, 50).Value = Proposer_id
                .Parameters.Add("@Notes", Data.SqlDbType.NVarChar, 500).Value = Notes
                .Parameters.Add("@Note_date", Data.SqlDbType.DateTime).Value = Note_Date
                .Parameters.Add("@Notes_by", Data.SqlDbType.VarChar, 50).Value = Notes_by
                .Parameters.Add("@Notes_Type", Data.SqlDbType.VarChar, 50).Value = Notes_Type
                '.Parameters.Add("@FAMILY_NO", Data.SqlDbType.VarChar, 50).Value = FAMILY_NO
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function CALL_UPLOAD_ITEMS(ByVal Confirm_Call_Code As String, ByVal Proposer_id As String, ByVal Item_Code As String, ByVal Code As Integer) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[sp_item_Call_update]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@Confirm_Call_Code", Data.SqlDbType.VarChar, 50).Value = Confirm_Call_Code
                .Parameters.Add("@Item_Code", Data.SqlDbType.VarChar, 50).Value = Item_Code
                .Parameters.Add("@Proposer_id", Data.SqlDbType.VarChar, 100).Value = Proposer_id
                .Parameters.Add("@code", Data.SqlDbType.Int).Value = Code
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function UPDATE_RETENTION_DOC(ByVal File_No As String, ByVal Ret_ACK As Integer, ByVal Ret_Officer_allocate_DT As String, _
          ByVal Ret_Allocated_To As String) As Integer

            Dim myID As Double = 0
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_UPDATE_RETENTION_DOC", myConnection)
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@File_No", Data.SqlDbType.VarChar, 150).Value = File_No
                .Parameters.Add("@Ret_ACK", Data.SqlDbType.Int).Value = Ret_ACK
                .Parameters.Add("@Ret_Officer_allocate_DT", Data.SqlDbType.VarChar, 150).Value = Ret_Officer_allocate_DT
                .Parameters.Add("@Ret_Allocated_To", Data.SqlDbType.NVarChar, 50).Value = Ret_Allocated_To

                .ExecuteNonQuery()
            End With
            myConnection.Close()

            Return myID

        End Function
        '[Risk_Id],[Depart_Code],[Risk_Code],[Period_From],[Period_To],[Depart_Objective],[Risk_Title],[Risk_Descr],[Risk_Category],[Root_Cause],[Risk_Conseq],[Risk_Impact],[I_Rate],[Risk_Likelihood],[L_Rate],[I_Risk_Exposure],[I_Risk_Rate],[Current_Contr],[Perceived_Contr_Eff],[Perceived_Rate],[Desired_Contr_Effe],[R_Risk_Rate],[R_Risk_Exposure],[Is_Active],[Mitigations],[Due_Date],[Action_Owner],[Action_Status],[Updated_by],[Update_date],[Submitted],[Reviewed],[Reviewed_by],[Update_Status]  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER] WHERE  Risk_Id='" & Risk_Id & "'"
        Public Function Compute_Risk_Values(ByVal Depart_code As String, ByVal Risk_code As String, ByVal Period_From As String, ByVal Period_To As String) As Integer

            Dim myID As Double = 0
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("AAR_RISK_DB.[dbo].[SP_COMPUTE_RATES]", myConnection)
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Depart_code", Data.SqlDbType.VarChar, 20).Value = Depart_code
                .Parameters.Add("@Period_From", Data.SqlDbType.VarChar, 20).Value = Period_From
                .Parameters.Add("@Period_To", Data.SqlDbType.VarChar, 20).Value = Period_To
                .Parameters.Add("@Risk_Code", Data.SqlDbType.VarChar, 20).Value = Risk_code
                .ExecuteNonQuery()
            End With
            myConnection.Close()

            Return myID

        End Function


        Public Function Compute_Risk_summary(ByVal Depart_code As String, ByVal Period_From As String, ByVal Period_To As String) As Integer

            Dim myID As Double = 0
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("AAR_RISK_DB.[dbo].[SP_COMPUTE_RATES_Depart]", myConnection)
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Depart_code", Data.SqlDbType.VarChar, 20).Value = Depart_code
                .Parameters.Add("@Period_From", Data.SqlDbType.VarChar, 20).Value = Period_From
                .Parameters.Add("@Period_To", Data.SqlDbType.VarChar, 20).Value = Period_To
                .ExecuteNonQuery()
            End With
            myConnection.Close()

            Return myID

        End Function
        Public Function update_register(ByVal Depart_Code As String, ByVal Risk_Code As String, ByVal Period_From As String, ByVal Period_To As String, ByVal Depart_Objective As String, ByVal Risk_Title As String, ByVal Risk_Descr As String, ByVal Risk_Category As String, ByVal Root_Cause As String, ByVal Risk_Conseq As String, ByVal Risk_Impact As String, ByVal I_Rate As Decimal, ByVal Risk_Likelihood As String, ByVal L_Rate As Decimal, ByVal I_Risk_Exposure As String, ByVal I_Risk_Rate As Decimal, ByVal Current_Contr As String, ByVal Perceived_Contr_Eff As String, ByVal Perceived_Rate As Decimal, ByVal Desired_Contr_Effe As String, ByVal R_Risk_Rate As Decimal, ByVal R_Risk_Exposure As String, ByVal Is_Active As String, ByVal Mitigations As String, ByVal Due_Date As String, ByVal Action_Owner As String, ByVal Action_Status As String, ByVal Updated_by As String, ByVal Update_date As String, ByVal sts As Integer) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[AAR_RISK_DB].dbo.sp_update_Register", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@Depart_Code", Data.SqlDbType.VarChar, 150).Value = Depart_Code
                .Parameters.Add("@Risk_Code", Data.SqlDbType.VarChar, 150).Value = Risk_Code
                .Parameters.Add("@Period_From", Data.SqlDbType.VarChar, 150).Value = Period_From
                .Parameters.Add("@Period_To", Data.SqlDbType.VarChar, 150).Value = Period_To
                .Parameters.Add("@Depart_Objective", Data.SqlDbType.VarChar, 150).Value = Depart_Objective
                .Parameters.Add("@Risk_Title", Data.SqlDbType.VarChar, 150).Value = Risk_Title
                .Parameters.Add("@Risk_Descr", Data.SqlDbType.VarChar, 200).Value = Risk_Descr
                .Parameters.Add("@Risk_Category", Data.SqlDbType.VarChar, 150).Value = Risk_Category
                .Parameters.Add("@Root_Cause", Data.SqlDbType.VarChar, 200).Value = Root_Cause
                .Parameters.Add("@Risk_Conseq", Data.SqlDbType.VarChar, 250).Value = Risk_Conseq
                .Parameters.Add("@Risk_Impact", Data.SqlDbType.VarChar, 150).Value = Risk_Impact
                .Parameters.Add("@I_Rate", Data.SqlDbType.Decimal).Value = I_Rate
                .Parameters.Add("@Risk_Likelihood", Data.SqlDbType.VarChar, 150).Value = Risk_Likelihood
                .Parameters.Add("@L_Rate", Data.SqlDbType.Decimal).Value = L_Rate
                .Parameters.Add("@I_Risk_Exposure", Data.SqlDbType.VarChar, 150).Value = I_Risk_Exposure
                .Parameters.Add("@I_Risk_Rate", Data.SqlDbType.Decimal).Value = I_Risk_Rate
                .Parameters.Add("@Current_Contr", Data.SqlDbType.VarChar, 150).Value = Current_Contr
                .Parameters.Add("@Perceived_Contr_Eff", Data.SqlDbType.VarChar, 150).Value = Perceived_Contr_Eff
                .Parameters.Add("@Perceived_Rate", Data.SqlDbType.Decimal).Value = Perceived_Rate
                .Parameters.Add("@Desired_Contr_Effe", Data.SqlDbType.VarChar, 150).Value = Desired_Contr_Effe
                .Parameters.Add("@R_Risk_Rate", Data.SqlDbType.Decimal).Value = R_Risk_Rate
                .Parameters.Add("@R_Risk_Exposure", Data.SqlDbType.VarChar, 150).Value = R_Risk_Exposure
                .Parameters.Add("@Is_Active", Data.SqlDbType.VarChar, 50).Value = Is_Active
                .Parameters.Add("@Mitigations", Data.SqlDbType.NVarChar, 200).Value = Mitigations
                .Parameters.Add("@Due_Date", Data.SqlDbType.VarChar, 150).Value = Due_Date
                .Parameters.Add("@Action_Owner", Data.SqlDbType.VarChar, 150).Value = Action_Owner
                .Parameters.Add("@Action_Status", Data.SqlDbType.VarChar, 150).Value = Action_Status
                .Parameters.Add("@Updated_by", Data.SqlDbType.VarChar, 150).Value = Updated_by
                .Parameters.Add("@Update_date", Data.SqlDbType.VarChar, 150).Value = Update_date
                .Parameters.Add("@sts", Data.SqlDbType.Int).Value = sts
                '.Parameters.Add("@Update_Status", Data.SqlDbType.VarChar, 150).Value = Update_Status
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function Retention_Register_corp_rev(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal POLICY_CODE As String, ByVal CORPORATE_ID As String, ByVal ACT_CODE As String, ByVal ACT_DATE As String, ByVal ACT_PERIOD As String, ByVal ENTERED_BY As String, ByVal ACT_NOTES As String, ByVal ACT_MINUTES As String, ByVal Activity_id As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Retention_ACTIVITY_REV", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@CORPORATE_ID", Data.SqlDbType.VarChar, 150).Value = CORPORATE_ID
                .Parameters.Add("@POLICY_CODE", Data.SqlDbType.VarChar, 150).Value = POLICY_CODE
                .Parameters.Add("@ACT_CODE", Data.SqlDbType.VarChar, 150).Value = ACT_CODE
                .Parameters.Add("@ACT_DATE", Data.SqlDbType.VarChar, 150).Value = ACT_DATE
                .Parameters.Add("@ACT_PERIOD", Data.SqlDbType.VarChar, 50).Value = ACT_PERIOD
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 150).Value = ENTERED_BY
                .Parameters.Add("@ACT_NOTES", Data.SqlDbType.Text).Value = ACT_NOTES
                .Parameters.Add("@ACT_MINUTES", Data.SqlDbType.Text).Value = ACT_MINUTES
                .Parameters.Add("@FILE_NAME", Data.SqlDbType.Text).Value = FILE_NAME
                .Parameters.Add("@Data", Data.SqlDbType.Binary).Value = bytes
                .Parameters.Add("@ContentType", SqlDbType.VarChar).Value = ContentType
                .Parameters.Add("@Activity_id", Data.SqlDbType.VarChar, 50).Value = Activity_id
                '.Parameters.Add("@PERIOD_TO", Data.SqlDbType.VarChar, 50).Value = PERIOD_TO
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function Retention_Register_corp(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal POLICY_CODE As String, ByVal CORPORATE_ID As String, ByVal ACT_CODE As String, ByVal ACT_DATE As String, ByVal ACT_PERIOD As String, ByVal ENTERED_BY As String, ByVal ACT_NOTES As String, ByVal ACT_MINUTES As String, ByVal PERIOD_FROM As String, ByVal PERIOD_TO As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_Retention_ACTIVITY", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@CORPORATE_ID", Data.SqlDbType.VarChar, 150).Value = CORPORATE_ID
                .Parameters.Add("@POLICY_CODE", Data.SqlDbType.VarChar, 150).Value = POLICY_CODE
                .Parameters.Add("@ACT_CODE", Data.SqlDbType.VarChar, 150).Value = ACT_CODE
                .Parameters.Add("@ACT_DATE", Data.SqlDbType.VarChar, 150).Value = ACT_DATE
                .Parameters.Add("@ACT_PERIOD", Data.SqlDbType.VarChar, 50).Value = ACT_PERIOD
                .Parameters.Add("@ENTERED_BY", Data.SqlDbType.VarChar, 150).Value = ENTERED_BY
                .Parameters.Add("@ACT_NOTES", Data.SqlDbType.Text).Value = ACT_NOTES
                .Parameters.Add("@ACT_MINUTES", Data.SqlDbType.Text).Value = ACT_MINUTES
                .Parameters.Add("@FILE_NAME", Data.SqlDbType.Text).Value = FILE_NAME
                .Parameters.Add("@Data", Data.SqlDbType.Binary).Value = bytes
                .Parameters.Add("@ContentType", SqlDbType.VarChar).Value = ContentType
                .Parameters.Add("@PERIOD_FROM", Data.SqlDbType.VarChar, 50).Value = PERIOD_FROM
                .Parameters.Add("@PERIOD_TO", Data.SqlDbType.VarChar, 50).Value = PERIOD_TO
                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function AddProfile(ByVal strProfileName As String, ByVal strProfileType As String, ByVal strRemarks As String) As Int32
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function UPLOAD_ITEMS_CR(ByVal TASK_CODE As String, ByVal DOC_CODE As String, ByVal DOC_Title As String, ByVal Entry_Date As String, ByVal Entered_By As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("Doc_Arc_DB.dbo.[sp_Task_Doc_update]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@CR_NO", Data.SqlDbType.VarChar, 50).Value = TASK_CODE
                .Parameters.Add("@DOC_CODE", Data.SqlDbType.VarChar, 50).Value = DOC_CODE
                .Parameters.Add("@Doc_Title", Data.SqlDbType.VarChar, 100).Value = DOC_Title
                .Parameters.Add("@Entry_Date", Data.SqlDbType.VarChar, 50).Value = Entry_Date
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By

                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function TASK_CREATION(ByVal CR_No As String, ByVal CR_Type As String, ByVal CR_Name As String, ByVal CR_dt As String, ByVal CR_Status As String, _
                                      ByVal Entered_by As String, ByVal Entry_Date As String, _
                                      ByVal CR_priority As String, ByVal CR_Description As String, ByVal System As String
                                      ) As Integer

            Dim myID As Double = 0
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_CR_CREATION", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@CR_No", Data.SqlDbType.VarChar, 50).Value = CR_No
                .Parameters.Add("@CR_Name", Data.SqlDbType.VarChar, 50).Value = CR_Name
                .Parameters.Add("@CR_Type", Data.SqlDbType.VarChar, 50).Value = CR_Type
                .Parameters.Add("@CR_dt", Data.SqlDbType.VarChar, 50).Value = CR_dt
                .Parameters.Add("@CR_Status", Data.SqlDbType.VarChar, 50).Value = CR_Status
                .Parameters.Add("@Entered_by", Data.SqlDbType.VarChar, 50).Value = Entered_by
                .Parameters.Add("@Entry_Date", Data.SqlDbType.VarChar, 50).Value = Entry_Date
                .Parameters.Add("@CR_priority", Data.SqlDbType.VarChar, 50).Value = CR_priority
                .Parameters.Add("@CR_Description", Data.SqlDbType.VarChar, 500).Value = CR_Description
                .Parameters.Add("@System", Data.SqlDbType.VarChar, 50).Value = System
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function UPLOAD_CR_DOCS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal CR_No As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("Doc_Arc_DB.dbo.sp_Task_CR_upload", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@DOC_ID", Data.SqlDbType.Int).Value = DOC_ID
                .Parameters.Add("@CR_No", Data.SqlDbType.VarChar, 150).Value = CR_No
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
        Public Function REGISTER_BUSINESS(ByVal File_No As String, ByVal Business_Type As String, ByVal Proposer_Name As String, ByVal Type As String, _
        ByVal Receive_Date As String, ByVal Receive_From As String, ByVal Agent As String, ByVal Benefit As String, ByVal Population As Decimal, ByVal Premium As Decimal, _
        ByVal Comment As String, ByVal STS As Integer) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function UpdateProfile(ByVal strProfileID As String, ByVal strProfileName As String, ByVal strProfileType As String, ByVal strRemarks As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function Flag_Loading(ByVal MEMBER_NO As String, ByVal MEMBER_NAME As String, ByVal PERIOD_FROM As String, ByVal PERIOD_TO As String, ByVal NOTES As String, ByVal FLAGED_BY As String, ByVal FLAG_DATE As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("CRM.dbo.SP_Flag_loading", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@MEMBER_NO", Data.SqlDbType.VarChar, 150).Value = MEMBER_NO
                .Parameters.Add("@MEMBER_NAME", Data.SqlDbType.VarChar, 150).Value = MEMBER_NAME
                .Parameters.Add("@NOTES", Data.SqlDbType.NVarChar, 250).Value = NOTES
                .Parameters.Add("@FLAGED_BY", Data.SqlDbType.VarChar, 150).Value = FLAGED_BY
                .Parameters.Add("@FLAG_DATE", Data.SqlDbType.VarChar, 50).Value = FLAG_DATE
                .Parameters.Add("@PERIOD_FROM", Data.SqlDbType.VarChar, 50).Value = PERIOD_FROM
                .Parameters.Add("@PERIOD_TO", Data.SqlDbType.VarChar, 50).Value = PERIOD_TO

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function Save_Loading(ByVal MEMBER_NO As String, ByVal MEMBER_NAME As String, ByVal AGE As Integer, ByVal OP_L_RATE As Decimal, ByVal IP_L_RATE As Decimal, ByVal IP_PREMIUM As Decimal, ByVal OP_PREMIUM As Decimal, ByVal LOADED_IP_PREM As Decimal, ByVal LOADED_OP_PREM As Decimal, ByVal S_PLUS_LOAD As Decimal, ByVal S_PLUS_PREM As Decimal, ByVal DIAGNOSIS As String, ByVal LOADED_BY As String, ByVal LOAD_DATE As String, ByVal PERIOD_FROM As String, ByVal PERIOD_TO As String, ByVal STS As Integer, ByVal POLICY As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("SP_update_loading", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@MEMBER_NO", Data.SqlDbType.VarChar, 150).Value = MEMBER_NO
                .Parameters.Add("@MEMBER_NAME", Data.SqlDbType.VarChar, 150).Value = MEMBER_NAME
                .Parameters.Add("@AGE", Data.SqlDbType.Int).Value = AGE
                .Parameters.Add("@OP_L_RATE", Data.SqlDbType.Decimal).Value = OP_L_RATE
                .Parameters.Add("@IP_L_RATE", Data.SqlDbType.Decimal).Value = IP_L_RATE
                .Parameters.Add("@IP_PREMIUM", Data.SqlDbType.Decimal).Value = IP_PREMIUM
                .Parameters.Add("@OP_PREMIUM", Data.SqlDbType.Decimal).Value = OP_PREMIUM
                .Parameters.Add("@LOADED_IP_PREM", Data.SqlDbType.Decimal).Value = LOADED_IP_PREM
                .Parameters.Add("@LOADED_OP_PREM", Data.SqlDbType.Decimal).Value = LOADED_OP_PREM
                .Parameters.Add("@S_PLUS_LOAD", Data.SqlDbType.Decimal).Value = S_PLUS_LOAD
                .Parameters.Add("@S_PLUS_PREM", Data.SqlDbType.Decimal).Value = S_PLUS_PREM
                .Parameters.Add("@DIAGNOSIS", Data.SqlDbType.NVarChar, 250).Value = DIAGNOSIS
                .Parameters.Add("@LOADED_BY", Data.SqlDbType.VarChar, 150).Value = LOADED_BY
                .Parameters.Add("@LOAD_DATE", Data.SqlDbType.VarChar, 50).Value = LOAD_DATE
                .Parameters.Add("@PERIOD_FROM", Data.SqlDbType.VarChar, 50).Value = PERIOD_FROM
                .Parameters.Add("@PERIOD_TO", Data.SqlDbType.VarChar, 50).Value = PERIOD_TO
                .Parameters.Add("@POLICY", Data.SqlDbType.VarChar, 50).Value = POLICY
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function

        Public Function UpdateEmployees(ByVal strEmployeeID As String, ByVal approvedBy As String, ByVal approved As Boolean, _
        ByVal strProfileID As String, ByVal strEmployeeName As String, ByVal strTitle As String, ByVal strTelExt As String, _
        ByVal strHomePhone As String, ByVal strCellphone As String, ByVal strEmail As String, ByVal strUserName As String, _
        ByVal Password As String, ByVal strOtherEmail As String, ByVal IntDaysToLockUser As Int16, ByVal IntUserLocked As Int16, _
        ByVal MODIFIEDBY As String, ByVal department As String, Optional ByVal RecordStatus As String = "Update", Optional ByVal EmailSent As Boolean = False) As Boolean


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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

            DecryptedStr = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function UPLOAD_PNI_CLAIMS(ByVal File_No As String, ByVal DOC_CODE As String, ByVal DOC_Title As String, ByVal Entry_Date As String, ByVal Entered_By As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.[sp_PNI_claim_Doc_update]", myConnection)

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
        Public Function UPLOAD_IP_CLAIMS(ByVal File_No As String, ByVal DOC_CODE As String, ByVal DOC_Title As String, ByVal Entry_Date As String, ByVal Entered_By As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.[sp_IP_claim_Doc_update]", myConnection)

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
        Public Function UPLOAD_ITEMS_1(File_No As String, DOC_CODE As String, DOC_Title As String, Entry_Date As String, Entered_By As String, bytes As Byte(), FILE_NAME As String, ContentType As String) As Integer
            Dim num As Double = 0.0
            Dim text As String = "rijndael"
            Dim cryptoFactory As DocManagementSecurity.CryptoFactory = New DocManagementSecurity.CryptoFactory()
            Dim crypto As DocManagementSecurity.ICrypto = cryptoFactory.MakeCryptographer(text)
            Dim text2 As String = crypto.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
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
        Public Function UPLOAD_OFF_SMART(ByVal Ref_No As String, ByVal DOC_CODE As String, ByVal DOC_Title As String, ByVal Entry_Date As String, ByVal Entered_By As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.[sp_Off_Smart_claim_Doc_update]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@Ref_No", Data.SqlDbType.VarChar, 50).Value = Ref_No
                .Parameters.Add("@DOC_CODE", Data.SqlDbType.VarChar, 50).Value = DOC_CODE
                .Parameters.Add("@Doc_Title", Data.SqlDbType.VarChar, 100).Value = DOC_Title
                .Parameters.Add("@Entry_Date", Data.SqlDbType.VarChar, 50).Value = Entry_Date
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By

                .ExecuteNonQuery()

            End With
            myConnection.Close()

            Return myID


        End Function
        Public Function UPLOAD_CLAIMS(ByVal File_No As String, ByVal DOC_CODE As String, ByVal DOC_Title As String, ByVal Entry_Date As String, ByVal Entered_By As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function UPLOAD_ITEMS(ByVal File_No As String, ByVal DOC_CODE As String, ByVal DOC_Title As String, ByVal Entry_Date As String, ByVal Entered_By As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function UPLOAD_File_DOC_LOU(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_DOC_upload_LOU", myConnection)

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
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function

        Public Function UPLOAD_File_DOC_LETTER(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_DOC_upload_Letter", myConnection)

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
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function UPLOAD_File_COMMITTAL(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String, ByVal DOC_REF As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_Commital_upload", myConnection)

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
                .Parameters.Add("@Doc_Ref", SqlDbType.NVarChar, 50).Value = DOC_REF
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function UPLOAD_File_DOC_PNI_SAGE(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String, ByVal DOC_REF As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_DOC_upload_PNI_SAGE", myConnection)

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
                .Parameters.Add("@Doc_Ref", SqlDbType.NVarChar, 50).Value = DOC_REF
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function UPLOAD_File_DOC_INVOIC(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String, ByVal DOC_REF As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_DOC_upload_Invoice", myConnection)

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
                .Parameters.Add("@Doc_Ref", SqlDbType.NVarChar, 50).Value = DOC_REF
                .ExecuteNonQuery()

            End With
            myConnection.Close()
            Return myID

        End Function
        Public Function UPLOAD_Off_Smart_File_CLAIMS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal Ref_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_Off_Smart_Claim_upload", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@DOC_ID", Data.SqlDbType.VarChar, 50).Value = DOC_ID
                .Parameters.Add("@Ref_NO", Data.SqlDbType.VarChar, 50).Value = Ref_NO
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
        Public Function UPLOAD_File_CLAIMS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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
        Public Function update_kyc(ByVal Proposer_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[dbo].SP_VALIDATE_MEMBER_KYC", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Proposer_ID", Data.SqlDbType.VarChar, 50).Value = Proposer_ID

                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function UPDATE_KYC_MEMBER(ByVal Proposer_ID As String, ByVal Member_No As String, ByVal Mobile_No As String, ByVal Member_Id As String, ByVal ID_Doc_No As String, ByVal ID_Doc_Type As String, ByVal Pin_No As String, ByVal Email As String, ByVal VALID As Integer, ByVal upload_by As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[dbo].SP_VALIDATE_MEMBER_KYC", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Proposer_ID", Data.SqlDbType.VarChar, 50).Value = Proposer_ID
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Mobile_No", Data.SqlDbType.VarChar, 50).Value = Mobile_No
                .Parameters.Add("@Member_Id", Data.SqlDbType.VarChar, 50).Value = Member_Id
                .Parameters.Add("@ID_Doc_No", Data.SqlDbType.VarChar, 50).Value = ID_Doc_No
                .Parameters.Add("@ID_Doc_Type", Data.SqlDbType.VarChar, 50).Value = ID_Doc_Type
                .Parameters.Add("@Pin_No", Data.SqlDbType.VarChar, 50).Value = Pin_No
                .Parameters.Add("@Email", Data.SqlDbType.VarChar, 100).Value = Email
                .Parameters.Add("@VALID", Data.SqlDbType.Int).Value = VALID
                .Parameters.Add("@upload_by", Data.SqlDbType.VarChar, 50).Value = upload_by
                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function VALIDATE_MEMBER(ByVal Proposer_ID As String, ByVal Member_No As String, ByVal Mobile_No As String, ByVal Member_Id As String, ByVal ID_Doc_No As String, ByVal ID_Doc_Type As String, ByVal Pin_No As String, ByVal Email As String, ByVal VALID As Integer, ByVal upload_by As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[dbo].SP_VALIDATE_MEMBER_KYC", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Proposer_ID", Data.SqlDbType.VarChar, 50).Value = Proposer_ID
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Mobile_No", Data.SqlDbType.VarChar, 50).Value = Mobile_No
                .Parameters.Add("@Member_Id", Data.SqlDbType.VarChar, 50).Value = Member_Id
                .Parameters.Add("@ID_Doc_No", Data.SqlDbType.VarChar, 50).Value = ID_Doc_No
                .Parameters.Add("@ID_Doc_Type", Data.SqlDbType.VarChar, 50).Value = ID_Doc_Type
                .Parameters.Add("@Pin_No", Data.SqlDbType.VarChar, 50).Value = Pin_No
                .Parameters.Add("@Email", Data.SqlDbType.VarChar, 100).Value = Email
                .Parameters.Add("@VALID", Data.SqlDbType.Int).Value = VALID
                .Parameters.Add("@upload_by", Data.SqlDbType.VarChar, 50).Value = upload_by
                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function UPLOAD_File_Complain_Docs(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_DOC_upload_Complain", myConnection)

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
        Public Function UPLOAD_File_IP_CLAIMS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_ip_Claim_upload", myConnection)

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
        Public Function UPLOAD_File_PNI_CLAIMS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].[dbo].[sp_File_PNM_Claim_upload]", myConnection)

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
        Public Function UPLOAD_File_DOCS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_DOC_upload", myConnection)

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
        Public Function UPLOAD_File_DOCS(ByVal bytes As Byte(), ByVal FILE_NAME As String, ByVal ContentType As String, ByVal File_NO As String, ByVal Doc_Title As String, ByVal Doc_Date As String, ByVal Upload_By As String, ByVal Upload_date As String, ByVal DOC_ID As Integer) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[Doc_Arc_DB].dbo.sp_File_DOC_upload", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output
                .Parameters.Add("@DOC_ID", Data.SqlDbType.Int, 50).Value = DOC_ID
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
        Public Function Contact_Member(ByVal Member_No As String, ByVal Member_Name As String, ByVal Primary_Mobile_No As Decimal, ByVal Secondary_Mobile_No As Decimal, ByVal Pin_No As String,
                                  ByVal EMail As String, ByVal ID_Passport_No As String, ByVal Gender As String, ByVal Physical_Addr As String, ByVal Marital_Status As String,
                                  ByVal EnteredBy As String, ByVal Entry_date As String, ByVal DOB As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[CRM].[dbo].SP_MIS_MEMBER_CONTACTS", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Primary_Mobile_No", Data.SqlDbType.Decimal).Value = Primary_Mobile_No
                .Parameters.Add("@Secondary_Mobile_No", Data.SqlDbType.Decimal).Value = Secondary_Mobile_No
                .Parameters.Add("@Pin_No", Data.SqlDbType.VarChar, 50).Value = Pin_No
                .Parameters.Add("@EMail", Data.SqlDbType.VarChar, 50).Value = EMail
                .Parameters.Add("@Member_Name", Data.SqlDbType.VarChar, 150).Value = Member_Name

                .Parameters.Add("@ID_Passport_No", Data.SqlDbType.VarChar, 150).Value = ID_Passport_No
                .Parameters.Add("@Gender", Data.SqlDbType.VarChar, 150).Value = Gender
                .Parameters.Add("@Physical_Addr", Data.SqlDbType.VarChar, 50).Value = Physical_Addr
                .Parameters.Add("@Marital_Status", Data.SqlDbType.VarChar, 50).Value = Marital_Status
                .Parameters.Add("@EnteredBy", Data.SqlDbType.VarChar, 50).Value = EnteredBy
                .Parameters.Add("@Entry_date", Data.SqlDbType.VarChar, 50).Value = Entry_date
                .Parameters.Add("@DOB", Data.SqlDbType.VarChar, 50).Value = DOB
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function update_NOK_Pre_auth(ByVal Member_No As String, ByVal Case_No As String, ByVal Name As String, ByVal Relation As String, ByVal Mobile_no As String, ByVal Email As String, ByVal Notified As String, ByVal Notify_Date As String, ByVal Notify_By As String) As Integer
            Dim myID As Double = 0
 
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[dbo].SP_MIS_CRM_IP_NOK", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Case_No", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Name", Data.SqlDbType.VarChar, 150).Value = Name
                .Parameters.Add("@Relation", Data.SqlDbType.VarChar, 50).Value = Relation
                .Parameters.Add("@Mobile_no", Data.SqlDbType.VarChar, 50).Value = Mobile_no
                .Parameters.Add("@Email", Data.SqlDbType.VarChar, 50).Value = Email
                .Parameters.Add("@Notified", Data.SqlDbType.VarChar, 5).Value = Notified
                .Parameters.Add("@Notify_Date", Data.SqlDbType.VarChar, 50).Value = Notify_Date
                .Parameters.Add("@Notify_By", Data.SqlDbType.VarChar, 50).Value = Notify_By
                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function update_Provider_Pre_auth(ByVal Case_No As String, ByVal Prov_Type As String, ByVal Provider As String, ByVal Pre_Auth_Amt As Decimal, ByVal Pre_Auth_By As String, ByVal Pre_Auth_Dt As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[dbo].SP_MIS_CRM_IP_Provider_Pre_auth", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Case_No", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Provider", Data.SqlDbType.VarChar, 50).Value = Provider
                .Parameters.Add("@Pre_Auth_Amt", Data.SqlDbType.Decimal).Value = Pre_Auth_Amt
                .Parameters.Add("@Pre_auth_dt", Data.SqlDbType.VarChar, 50).Value = Pre_Auth_Dt
                .Parameters.Add("@Pre_auth_By", Data.SqlDbType.VarChar, 50).Value = Pre_Auth_By
                .Parameters.Add("@Prov_Type", Data.SqlDbType.VarChar, 50).Value = Prov_Type
                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function update_Benefit_Pre_auth(ByVal Case_No As String, ByVal Benefit_Name As String, ByVal Pre_auth_Amt As Decimal, ByVal Pre_auth_By As String, ByVal Pre_auth_dt As String) As Integer
            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[dbo].SP_MIS_CRM_IP_Benefit_Pre_auth", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure

                .Parameters.Add("@Case_No", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Benefit_Name", Data.SqlDbType.VarChar, 150).Value = Benefit_Name
                .Parameters.Add("@Pre_auth_Amt", Data.SqlDbType.Decimal).Value = Pre_auth_Amt
                .Parameters.Add("@Pre_auth_dt", Data.SqlDbType.VarChar, 50).Value = Pre_auth_dt
                .Parameters.Add("@Pre_auth_By", Data.SqlDbType.VarChar, 50).Value = Pre_auth_By

                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function Pre_Auth_reg(ByVal Case_No As String, ByVal Member_No As String, ByVal Member_Name As String, ByVal Proposer_Name As String, ByVal Client_Type As String, ByVal Mobile_no As String,
                                     ByVal Email As String, ByVal Receive_Dt As String, ByVal Receive_Time As String, ByVal Mode As String, ByVal Admission_Dt As String, ByVal Discharge_Dt As String,
                                     ByVal Hospital As String, ByVal Pri_Doctor As String,
                                     ByVal Entered_By As String, ByVal Entry_Dt As String, ByVal Claim_Type As String, ByVal Agent_id As String, ByVal RM_Code As String, ByVal STS As Integer) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[dbo].[sp_MIS_CRM_Pre_Auth_Register]", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Case_No", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Member_Name", Data.SqlDbType.VarChar, 150).Value = Member_Name
                .Parameters.Add("@Proposer_Name", Data.SqlDbType.VarChar, 150).Value = Proposer_Name
                .Parameters.Add("@Client_Type", Data.SqlDbType.VarChar, 50).Value = Client_Type
                .Parameters.Add("@Mobile_no", Data.SqlDbType.VarChar, 50).Value = Mobile_no
                .Parameters.Add("@Email", Data.SqlDbType.VarChar, 100).Value = Email
                .Parameters.Add("@Receive_Dt", Data.SqlDbType.VarChar, 50).Value = Receive_Dt
                .Parameters.Add("@Receive_Time", Data.SqlDbType.VarChar, 50).Value = Receive_Time
                .Parameters.Add("@Mode", Data.SqlDbType.VarChar, 50).Value = Mode
                .Parameters.Add("@Admission_Dt", Data.SqlDbType.VarChar, 50).Value = Admission_Dt
                .Parameters.Add("@Discharge_Dt", Data.SqlDbType.VarChar, 50).Value = Discharge_Dt
                .Parameters.Add("@Hospital", Data.SqlDbType.VarChar, 50).Value = Hospital
                .Parameters.Add("@Pri_Doctor", Data.SqlDbType.VarChar, 50).Value = Pri_Doctor
                '.Parameters.Add("@Auth_Amt", Data.SqlDbType.Decimal).Value = Auth_Amt
                '.Parameters.Add("@Bed_Limit", Data.SqlDbType.Decimal).Value = Bed_Limit
                .Parameters.Add("@Claim_Type", Data.SqlDbType.VarChar, 10).Value = Claim_Type
                '.Parameters.Add("@Benefit", Data.SqlDbType.VarChar, 50).Value = Benefit
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Entry_Dt", Data.SqlDbType.VarChar, 50).Value = Entry_Dt
                .Parameters.Add("@Agent_id", Data.SqlDbType.VarChar, 50).Value = Agent_id
                .Parameters.Add("@RM_Code", Data.SqlDbType.VarChar, 5).Value = RM_Code
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS


                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function Data_Enrichment(ByVal Ref_No As String, ByVal Invoice_No As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("sp_MIS_CRM_Committal_enrichment", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                ' .Parameters.Add("@Ref_No", Data.SqlDbType.VarChar, 50).Value = Ref_No
                '.Parameters.Add("@Invoice_No", Data.SqlDbType.VarChar, 50).Value = Invoice_No


                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function Complaint_Escalate(ByVal Case_No As String,
                                  ByVal Entered_By As String,
                                    ByVal Summary_of_issue As String, ByVal Action_Taken As String, ByVal Description As String, ByVal Department As String) As Boolean

            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("dbo.SP_MIS_CRM_COMPLAINTS_ESCALATE", myConnection)
            With myCommand

                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Case_no", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Summary_of_issue", Data.SqlDbType.VarChar, 50).Value = Summary_of_issue
                .Parameters.Add("@Action_Taken", Data.SqlDbType.VarChar, 50).Value = Action_Taken
                .Parameters.Add("@Description", Data.SqlDbType.NVarChar, 200).Value = Description
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Department", Data.SqlDbType.VarChar, 50).Value = Department
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function Risk_Escalate(ByVal Case_No As String,
                                  ByVal Entered_By As String,
                                    ByVal Summary_of_issue As String, ByVal Action_Taken As String, ByVal Description As String, ByVal Department As String) As Boolean

            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("dbo.SP_MIS_CRM_RISK_ESCALATE", myConnection)
            With myCommand

                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Case_no", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Summary_of_issue", Data.SqlDbType.VarChar, 50).Value = Summary_of_issue
                .Parameters.Add("@Action_Taken", Data.SqlDbType.VarChar, 50).Value = Action_Taken
                .Parameters.Add("@Description", Data.SqlDbType.Text).Value = Description
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Department", Data.SqlDbType.VarChar, 50).Value = Department
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function Complaint_tracking(ByVal Case_No As String, ByVal Date_Received As String, ByVal Time_Received As String, ByVal Mode_of_Receipt As String,
                                  ByVal Received_By As String, ByVal Membership_No As String, ByVal Customer_Name As String, ByVal Customer_Type As String, ByVal Contacts As String,
                                   ByVal Email As String, ByVal Complain_Type As String, ByVal Summary_of_issue As String, ByVal Action_Taken As String, ByVal Escalated_To As String, ByVal Description As String, ByVal Date_of_Resolution As String, ByVal Entered_By As String, ByVal Department As String) As Boolean

            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("SP_MIS_CRM_COMPLAINTS_REGISTER", myConnection)
            With myCommand

                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Case_no", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Date_Received", Data.SqlDbType.VarChar, 50).Value = Date_Received
                .Parameters.Add("@Time_Received", Data.SqlDbType.VarChar, 50).Value = Time_Received
                .Parameters.Add("@Mode_of_Receipt", Data.SqlDbType.VarChar, 50).Value = Mode_of_Receipt
                .Parameters.Add("@Received_By", Data.SqlDbType.VarChar, 50).Value = Received_By
                .Parameters.Add("@Membership_No", Data.SqlDbType.VarChar, 50).Value = Membership_No
                .Parameters.Add("@Customer_Name", Data.SqlDbType.VarChar, 150).Value = Customer_Name
                .Parameters.Add("@Customer_Type", Data.SqlDbType.VarChar, 50).Value = Customer_Type
                .Parameters.Add("@Contacts", Data.SqlDbType.VarChar, 50).Value = Contacts
                .Parameters.Add("@Email", Data.SqlDbType.VarChar, 50).Value = Email
                .Parameters.Add("@Complain_Type", Data.SqlDbType.VarChar, 50).Value = Complain_Type
                .Parameters.Add("@Summary_of_issue", Data.SqlDbType.VarChar, 50).Value = Summary_of_issue
                .Parameters.Add("@Action_Taken", Data.SqlDbType.VarChar, 50).Value = Action_Taken
                .Parameters.Add("@Description", Data.SqlDbType.NVarChar, 200).Value = Description
                .Parameters.Add("@Escalated_To", Data.SqlDbType.VarChar, 50).Value = Escalated_To
                .Parameters.Add("@Date_of_Resolution ", Data.SqlDbType.VarChar, 50).Value = Date_of_Resolution
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Department", Data.SqlDbType.VarChar, 50).Value = Department
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function Off_system_Tracking(Ref_No As String, Mobile_No As String, Member_No As String, Member_Name As String, Proposer_Name As String, Provider_ID As String, Service_Dt As String, Reason As String, Off_Type As String, Entered_By As String, STS As Integer, New_Mem As Integer, Time_in As String, Time_out As String, MIS_No As String, Benefit As String) As Boolean
            Dim text As String = "rijndael"
            Dim cryptoFactory As DocManagementSecurity.CryptoFactory = New DocManagementSecurity.CryptoFactory()
            Dim crypto As DocManagementSecurity.ICrypto = cryptoFactory.MakeCryptographer(text)
            Dim text2 As String = crypto.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
            Dim sqlConnection As SqlConnection = New SqlConnection(text2)
            sqlConnection.Open()
            Dim sqlCommand As SqlCommand = New SqlCommand("sp_MIS_CRM_Off_system_Tracking", sqlConnection)
            Dim sqlCommand2 As SqlCommand = sqlCommand
            sqlCommand2.CommandType = CommandType.StoredProcedure
            sqlCommand2.Parameters.Add("@Ref_No", SqlDbType.VarChar, 50).Value = Ref_No
            sqlCommand2.Parameters.Add("@Mobile_No", SqlDbType.VarChar, 50).Value = Mobile_No
            sqlCommand2.Parameters.Add("@Member_No", SqlDbType.Text).Value = Member_No
            sqlCommand2.Parameters.Add("@Member_Name", SqlDbType.VarChar, 50).Value = Member_Name
            sqlCommand2.Parameters.Add("@Proposer_Name", SqlDbType.VarChar, 150).Value = Proposer_Name
            sqlCommand2.Parameters.Add("@Provider_ID", SqlDbType.VarChar, 50).Value = Provider_ID
            sqlCommand2.Parameters.Add("@Service_Dt", SqlDbType.VarChar, 50).Value = Service_Dt
            sqlCommand2.Parameters.Add("@Reason", SqlDbType.VarChar, 150).Value = Reason
            sqlCommand2.Parameters.Add("@Off_Type", SqlDbType.VarChar, 50).Value = Off_Type
            sqlCommand2.Parameters.Add("@Entered_By", SqlDbType.VarChar, 50).Value = Entered_By
            sqlCommand2.Parameters.Add("@STS", SqlDbType.Int).Value = STS
            sqlCommand2.Parameters.Add("@New_Mem", SqlDbType.Int).Value = New_Mem
            sqlCommand2.Parameters.Add("@Time_in", SqlDbType.VarChar, 50).Value = Time_in
            sqlCommand2.Parameters.Add("@Time_out", SqlDbType.VarChar, 50).Value = Time_out
            sqlCommand2.Parameters.Add("@MIS_No", SqlDbType.VarChar, 50).Value = MIS_No
            sqlCommand2.Parameters.Add("@Benefit", SqlDbType.VarChar, 50).Value = Benefit
            sqlCommand2.ExecuteNonQuery()
            sqlConnection.Close()
            Return True
        End Function
        Public Function Committal_Tracking(ByVal Proposer_Id As String, ByVal Ref_No As String, ByVal Proposer_Name As String, ByVal Premium_Amt As Decimal, ByVal Paid_Amt As Decimal,
                                   ByVal Committal_Amt As Decimal, ByVal Credit_Period As Integer, ByVal Effective_Dt As String, ByVal Due_Dt As String,
                                   ByVal Request As String, ByVal Manager As String, ByVal Business As String, ByVal entered_by As String, ByVal Requested_by As String, ByVal Committal_Type As String, ByVal STS As Integer) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""
            '[Ref_No],[Proposer_Name],[Premium_Amt],[Paid_Amt],[Committal_Amt],[Credit_Period],[Effective_Dt],[Due_Dt],[RM_Name],[Manager],[New_Client] 

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("sp_MIS_CRM_Committal_Tracking", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Ref_No", Data.SqlDbType.VarChar, 50).Value = Ref_No
                .Parameters.Add("@Proposer_Name", Data.SqlDbType.VarChar, 150).Value = Proposer_Name
                .Parameters.Add("@Premium_Amt", Data.SqlDbType.Decimal).Value = Premium_Amt
                .Parameters.Add("@Paid_Amt", Data.SqlDbType.Decimal).Value = Paid_Amt
                .Parameters.Add("@Committal_Amt", Data.SqlDbType.Decimal).Value = Committal_Amt
                .Parameters.Add("@Credit_Period", Data.SqlDbType.VarChar, 50).Value = Credit_Period
                .Parameters.Add("@Effective_Dt", Data.SqlDbType.VarChar, 50).Value = Effective_Dt
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = entered_by
                .Parameters.Add("@Due_Dt", Data.SqlDbType.VarChar, 50).Value = Due_Dt
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .Parameters.Add("@Request", Data.SqlDbType.VarChar, 5).Value = Request
                .Parameters.Add("@Manager", Data.SqlDbType.VarChar, 50).Value = Manager
                .Parameters.Add("@Business", Data.SqlDbType.VarChar, 5).Value = Business
                .Parameters.Add("@Committal_Type", Data.SqlDbType.VarChar, 5).Value = Committal_Type
                .Parameters.Add("@Proposer_id", Data.SqlDbType.VarChar, 50).Value = Proposer_Id
                .Parameters.Add("@Requested_By", Data.SqlDbType.VarChar, 50).Value = Requested_by
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function HPC_reg(ByVal Member_No As String, ByVal Member_Name As String, ByVal Proposer_Name As String, ByVal Client_Type As String,
                                   ByVal Doctor As String, ByVal Mobile_No As String, ByVal eMail As String, ByVal Followup_Dt As String,
                                   ByVal Entered_By As String, ByVal STS As Integer, ByVal updated As Integer, ByVal HPC_Src As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("sp_MIS_CRM_HPC_Register", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Member_Name", Data.SqlDbType.VarChar, 150).Value = Member_Name
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Client_type", Data.SqlDbType.VarChar, 50).Value = Client_Type
                .Parameters.Add("@Proposer_Name", Data.SqlDbType.VarChar, 150).Value = Proposer_Name
                .Parameters.Add("@eMail", Data.SqlDbType.VarChar, 50).Value = eMail
                .Parameters.Add("@Mobile_No", Data.SqlDbType.VarChar, 50).Value = Mobile_No
                .Parameters.Add("@Followup_Dt", Data.SqlDbType.VarChar, 50).Value = Followup_Dt
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@HPC_Src", Data.SqlDbType.VarChar, 50).Value = HPC_Src
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .Parameters.Add("@updated", Data.SqlDbType.Int).Value = updated
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function Covid_reg(ByVal Case_No As String, ByVal Admission_notes As String, ByVal Admission_Dt As String, ByVal Comorbidites As String, ByVal Member_Name As String,
                                  ByVal Member_No As String, ByVal Proposer_Name As String, ByVal Client_Type As String, ByVal Primary_Provider As String, ByVal Transfer_To_Provider As String,
                                  ByVal Facility_Type As String, ByVal Pre_Auth_Amt As Double, ByVal Admission_Status As String, ByVal Claim_Type As String, ByVal Case_Status As String, ByVal Entered_By As String, ByVal Claim_No As String, ByVal STS As Integer) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("sp_MIS_CRM_Cov_Register", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@Case_No", Data.SqlDbType.VarChar, 50).Value = Case_No
                .Parameters.Add("@Admission_notes", Data.SqlDbType.Text).Value = Admission_notes
                .Parameters.Add("@Client_type", Data.SqlDbType.VarChar, 50).Value = Client_Type
                .Parameters.Add("@Proposer_Name", Data.SqlDbType.VarChar, 150).Value = Proposer_Name
                .Parameters.Add("@Admission_Dt", Data.SqlDbType.VarChar, 50).Value = Admission_Dt
                .Parameters.Add("@Comorbidites", Data.SqlDbType.VarChar, 50).Value = Comorbidites
                .Parameters.Add("@Member_Name", Data.SqlDbType.VarChar, 150).Value = Member_Name
                .Parameters.Add("@Member_No", Data.SqlDbType.VarChar, 50).Value = Member_No
                .Parameters.Add("@Transfer_To_Provider", Data.SqlDbType.VarChar, 150).Value = Primary_Provider
                .Parameters.Add("@Primary_Provider", Data.SqlDbType.VarChar, 150).Value = Primary_Provider
                .Parameters.Add("@Entered_By", Data.SqlDbType.VarChar, 50).Value = Entered_By
                .Parameters.Add("@Facility_Type", Data.SqlDbType.VarChar, 50).Value = Facility_Type
                .Parameters.Add("@Pre_Auth_Amt", Data.SqlDbType.Decimal).Value = Pre_Auth_Amt
                .Parameters.Add("@Claim_Type", Data.SqlDbType.VarChar, 50).Value = Claim_Type
                .Parameters.Add("@Admission_Status", Data.SqlDbType.VarChar, 50).Value = Admission_Status
                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .Parameters.Add("@Case_Status", Data.SqlDbType.VarChar, 50).Value = Case_Status
                .Parameters.Add("@Claim_No", Data.SqlDbType.VarChar, 50).Value = Claim_No

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function ENROLL_UPDATE_EMAIL(ByVal FROMDT As Date, ByVal TODT As Date, ByVal USER_ID As String, ByVal EMAIL_SEND As Boolean, ByVal USER_TYPE As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("COMMISSION").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[COMMISSION].dbo.SP_UPDATE_EMAIL", myConnection)

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

        Public Function ENROLL_UPDATE_EMAIL_HR(ByVal USER_ID As String, ByVal EMAIL_SEND As Boolean, ByVal ID As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("COMMISSION").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("[COMMISSION].dbo.SP_UPDATE_EMAIL", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@USER_ID", Data.SqlDbType.VarChar, 150).Value = USER_ID
                .Parameters.Add("@EMAIL_SEND", Data.SqlDbType.Bit, 150).Value = EMAIL_SEND
                .Parameters.Add("@USER_TYPE", Data.SqlDbType.Int).Value = ID

                .ExecuteNonQuery()
                'myID = .Parameters.Item("@MEASURE_ID").Value
            End With

            myConnection.Close()

            Return myID

            'Catch ex As Exception

            'End Try

        End Function
        Public Function Business_Tracking_1(File_No As String, Business_Type As String, Client_type As String, Proposer_Name As String, Family_code As String, Agent_Id As String, Premium As Double, Card_type As String, Receive_dt As String, Is_Complete As Integer, Forwarded As Integer, Entered_By As String, Business As String, STS As Integer, Benefit As String, is_Branch As Integer, Walk_In_Client As String, Allocated_to As String, Rate_Type As String, Is_IPF As Integer, Pay_Ref_No As String, Paid_Amt As Decimal, ID_NO As String, PIN_NO As String, PAY_MODE As String, County_Code As String, Category As String, CR_12 As String, Sector As String, GI As String) As Boolean
            Dim text As String = "rijndael"
            Dim cryptoFactory As DocManagementSecurity.CryptoFactory = New DocManagementSecurity.CryptoFactory()
            Dim crypto As DocManagementSecurity.ICrypto = cryptoFactory.MakeCryptographer(text)
            Dim text2 As String = crypto.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
            Dim sqlConnection As SqlConnection = New SqlConnection(text2)
            sqlConnection.Open()
            Dim sqlCommand As SqlCommand = New SqlCommand("sp_MIS_CRM_Business_Tracking_1", sqlConnection)
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
            sqlCommand2.Parameters.Add("@GI_Category", SqlDbType.VarChar, 50).Value = GI
            sqlCommand2.ExecuteNonQuery()
            sqlConnection.Close()
            Return True
        End Function
        Public Function Business_Tracking(ByVal File_No As String, ByVal Business_Type As String, ByVal Client_type As String, ByVal Proposer_Name As String, ByVal Family_code As String, ByVal Agent_Id As String, ByVal Premium As Double, ByVal Is_Mtiba As Integer, ByVal Receive_dt As String, ByVal Is_Complete As Integer, ByVal Forwarded As Integer, ByVal Entered_By As String, ByVal Business As String, ByVal STS As Integer, ByVal Benefit As String, ByVal is_Branch As Integer, ByVal Walk_In_Client As String, ByVal Allocated_to As String, ByVal Rate_Type As String, ByVal Is_IPF As Integer, ByVal Pay_Ref_No As String, ByVal Paid_Amt As Decimal) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("sp_MIS_CRM_Business_Tracking", myConnection)

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
                .Parameters.Add("@Rate_Type", Data.SqlDbType.VarChar, 50).Value = Rate_Type
                .Parameters.Add("@Is_IPF", Data.SqlDbType.Int).Value = Is_IPF
                .Parameters.Add("@Pay_Ref_No", Data.SqlDbType.VarChar, 50).Value = Pay_Ref_No
                .Parameters.Add("@Paid_Amt", Data.SqlDbType.Decimal).Value = Paid_Amt
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function forward_Proposer_list_v(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[DB_MASTER_RENEWAL].dbo.[SP_UPATE_PROPOSER_RENEWAL_LIST]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@PERIOD_FROM_A", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@PERIOD_TO_A", Data.SqlDbType.Date, 200).Value = Rec_dateTo

                '.Parameters.Add("@uploaded_by", Data.SqlDbType.VarChar, 200).Value = uploaded_by
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function forward_Proposer_list(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("SP_UPATE_PROPOSER_RENEWAL_LIST", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@PERIOD_FROM_A", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@PERIOD_TO_A", Data.SqlDbType.Date, 200).Value = Rec_dateTo

                '.Parameters.Add("@uploaded_by", Data.SqlDbType.VarChar, 200).Value = uploaded_by
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function TRACK_IP_OP(ByVal FILE_NO As String, ByVal RECEIVE_DT As String, ByVal SERVICE_DT As String, ByVal BARCODE As String, ByVal CLAIM_TYPE As String, ByVal MEMBER_NO As String, ByVal PROVIDER_NAME As String, ByVal PROVIDER_ID As String, _
                                    ByVal INVOICE_NO As String, ByVal INVOICE_AMT As Decimal, ByVal COMMENT As String, ByVal Entered_by As String, ByVal STS As String) As Integer

            Dim myID As Double = 0

            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()
            Dim myCommand As New SqlCommand("MISREPORTS.dbo.SP_IP_OP_TRACKING", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@MEASURE_ID", Data.SqlDbType.Real).Direction = Data.ParameterDirection.Output

                .Parameters.Add("@FILE_NO", Data.SqlDbType.VarChar, 150).Value = FILE_NO
                .Parameters.Add("@RECEIVE_DT", Data.SqlDbType.VarChar, 150).Value = RECEIVE_DT
                .Parameters.Add("@SERVICE_DT", Data.SqlDbType.VarChar, 150).Value = SERVICE_DT
                .Parameters.Add("@BARCODE", Data.SqlDbType.VarChar, 150).Value = BARCODE

                .Parameters.Add("@CLAIM_TYPE", Data.SqlDbType.VarChar, 150).Value = CLAIM_TYPE
                .Parameters.Add("@MEMBER_NO", Data.SqlDbType.VarChar, 150).Value = MEMBER_NO
                .Parameters.Add("@PROVIDER_ID", Data.SqlDbType.VarChar, 150).Value = PROVIDER_ID
                .Parameters.Add("@INVOICE_NO", Data.SqlDbType.VarChar, 150).Value = INVOICE_NO

                .Parameters.Add("@INVOICE_AMT", Data.SqlDbType.Decimal).Value = INVOICE_AMT
                .Parameters.Add("@COMMENT", Data.SqlDbType.VarChar, 150).Value = COMMENT
                .Parameters.Add("@Entered_by", Data.SqlDbType.VarChar, 150).Value = Entered_by
                .Parameters.Add("@PROVIDER_NAME", Data.SqlDbType.VarChar, 150).Value = PROVIDER_NAME

                .Parameters.Add("@STS", Data.SqlDbType.Int).Value = STS
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return myID


        End Function
        Public Function import_Revise_Totals(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("SP_RENEWAL_TOTAL_REVISE", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                '.Parameters.Add("@PERIOD_FROM", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                '.Parameters.Add("@PERIOD_TO", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                '.Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function forward_Revised_rates(ByVal POLICY_CODE As String, ByVal DISPLAY_MEMBERSHIP_NO As String, ByVal uploaded_by As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[SP_UPLOAD_RENEWAL_REVISED_LIST]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@POLICY_CODE", Data.SqlDbType.NVarChar, 100).Value = POLICY_CODE
                .Parameters.Add("@DISPLAY_MEMBERSHIP_NO", Data.SqlDbType.NVarChar, 50).Value = DISPLAY_MEMBERSHIP_NO

                .Parameters.Add("@UPLOADED_BY", Data.SqlDbType.VarChar, 200).Value = uploaded_by
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function UPDATE_NCD_CLAIMS(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("SP_REN_CLAIMS_UPDATE_C", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                '.Parameters.Add("@PERIOD_FROM", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                '.Parameters.Add("@PERIOD_TO", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                '.Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function UPDATE_Renewal_CLAIMS(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("SP_REN_CLAIMS_UPDATE_NCD", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                '.Parameters.Add("@PERIOD_FROM", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                '.Parameters.Add("@PERIOD_TO", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                '.Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function import_Renewal_Totals(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("SP_RENEWAL_TOTAL", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@PERIOD_FROM", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@PERIOD_TO", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                '.Parameters.Add("@REMARKS", Data.SqlDbType.VarChar, 200).Value = strRemarks
                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function forward_Renewal_list_v(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date, ByVal uploaded_by As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("[DB_MASTER_RENEWAL].[dbo].[SP_UPLOAD_RENEWAL_LIST]", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@PERIOD_FROM", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@PERIOD_TO", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                .Parameters.Add("@uploaded_by", Data.SqlDbType.VarChar, 200).Value = uploaded_by

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function forward_Renewal_list(ByVal Rec_dateFrom As Date, ByVal Rec_dateTo As Date, ByVal uploaded_by As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("SP_UPLOAD_RENEWAL_LIST_CRM", myConnection)
            myCommand.CommandTimeout = 0
            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                '.Parameters.Add("@ProfileID", Data.SqlDbType.Int, 4).Value = strProfileID
                .Parameters.Add("@PERIOD_FROM", Data.SqlDbType.Date, 100).Value = Rec_dateFrom
                .Parameters.Add("@PERIOD_TO", Data.SqlDbType.Date, 200).Value = Rec_dateTo
                .Parameters.Add("@uploaded_by", Data.SqlDbType.VarChar, 200).Value = uploaded_by

                .ExecuteNonQuery()

            End With

            myConnection.Close()

            Return True
        End Function
        Public Function Reallocate_Agent(ByVal USER_ID As String, ByVal AGENT_NAME As String, ByVal RET_RM As String, ByVal CORP_RM As String, ByVal FORMER_RET_RM As String, ByVal FORMER_CORP_RM As String) As Boolean
            Dim MyProfileID As Int32 = 0
            Dim sqlstring As String = ""


            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

            Dim myConnection As New SqlConnection(DecryptedStr)
            myConnection.Open()

            Dim myCommand As New SqlCommand("sp_MIS_CRM_Reallocate_Agent", myConnection)

            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@USER_ID", Data.SqlDbType.VarChar, 50).Value = USER_ID
                .Parameters.Add("@AGENT_NAME", Data.SqlDbType.VarChar, 150).Value = AGENT_NAME
                .Parameters.Add("@RET_RM", Data.SqlDbType.VarChar, 50).Value = RET_RM
                .Parameters.Add("@CORP_RM", Data.SqlDbType.VarChar, 50).Value = CORP_RM
                .Parameters.Add("@FORMER_RET_RM", Data.SqlDbType.VarChar, 50).Value = FORMER_RET_RM
                .Parameters.Add("@FORMER_CORP_RM", Data.SqlDbType.VarChar, 50).Value = FORMER_CORP_RM
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

            Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

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


